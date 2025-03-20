// docs/.vitepress/config.mjs
import { defineConfig } from "vitepress";
import apiDocs from "../../docs-data/api-docs.json"; // ESM import from project root

export default defineConfig({
  title: "Quickbase JS API Docs",
  description: "Documentation for quickbase-js library",
  themeConfig: {
    nav: [
      {
        text: "GitHub",
        link: "https://github.com/DrewBradfordXYZ/quickbase-js/tree/main",
      },
    ],
    sidebar: [
      {
        text: "API Methods",
        items: apiDocs.map((method) => ({
          text: method.name,
          link: `#${method.name}`,
        })),
      },
    ],
  },
});
