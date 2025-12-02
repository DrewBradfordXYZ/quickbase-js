// tests/vitest/qb/auth/mockQuickbaseServer.ts
import express from "express";

export function startMockQuickbaseServer(port: number = 3000) {
  const app = express();
  app.use(express.json());
  let failNextCall = false;

  app.post("/v1/auth/oauth/token", (req, res) => {
    const { subject_token } = req.body;
    console.log("[Mock Server] Received SSO token request:", req.body);
    if (!subject_token) {
      return res.status(400).json({ message: "Missing SAML token" });
    }
    res.json({
      access_token: "mock-temp-token",
      token_type: "Bearer",
    });
  });

  app.get("/v1/apps/:appId", (req, res) => {
    const authHeader = req.headers.authorization;
    console.log(
      "[Mock Server] Received getApp request:",
      req.params,
      "Auth:",
      authHeader
    );
    if (!authHeader || !authHeader.startsWith("QB-TEMP-TOKEN")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (failNextCall) {
      failNextCall = false;
      return res.status(401).json({ message: "Token expired" });
    }
    res.json({
      id: req.params.appId,
      name: "Mock App",
      created: "2025-03-19T12:00:00Z",
      updated: "2025-03-19T12:00:00Z",
    });
  });

  app.post("/mock/toggle-fail", (req, res) => {
    failNextCall = true;
    console.log("[Mock Server] Toggling next getApp call to fail with 401");
    res.sendStatus(200);
  });

  const server = app.listen(port, () => {
    console.log(`Mock QuickBase server running on port ${port}`);
  });

  return {
    server,
    close: () => server.close(),
    toggleFail: () =>
      fetch(`http://localhost:${port}/mock/toggle-fail`, { method: "POST" }),
  };
}
