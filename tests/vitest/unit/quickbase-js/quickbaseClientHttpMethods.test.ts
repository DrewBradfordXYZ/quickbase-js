// tests/vitest/unit/quickbaseClient.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { quickbase } from "../../../src/quickbaseClient.ts";
import { mockFetch, QB_APP_ID, QB_REALM } from "../../setup.ts";
import {
  UpdateAppRequest,
  UpdateApp200Response,
} from "../../../src/generated/models/index.ts";
import { ChangesetSolution200Response } from "../../../src/generated/models/index.ts";

describe("QuickbaseClient Unit - HTTP Method Extraction", () => {
  let clientTemp: ReturnType<typeof quickbase>;
  let clientUser: ReturnType<typeof quickbase>;

  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();

    clientTemp = quickbase({
      realm: QB_REALM,
      userToken: "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
      debug: false,
      fetchApi: mockFetch,
      throttle: { rate: 10, burst: 10 },
      useTempTokens: true,
      tempTokenLifespan: 500,
    });

    clientUser = quickbase({
      realm: QB_REALM,
      userToken: "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
      debug: false,
      fetchApi: mockFetch,
      throttle: { rate: 10, burst: 10 },
      useTempTokens: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    mockFetch.mockReset();
  });

  const mockUpdateAppResponse: UpdateApp200Response = {
    id: QB_APP_ID,
    name: "Test App",
    description: "",
    created: new Date("2020-01-01T00:00:00Z"),
    updated: new Date("2020-01-01T00:00:00Z"),
    dateFormat: "MM-DD-YYYY",
    timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
    hasEveryoneOnTheInternet: false,
    ancestorId: undefined,
    variables: [],
    securityProperties: {},
    memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
    dataClassification: "None",
  };

  const mockChangesetResponse: ChangesetSolution200Response = [{ changes: [] }];

  const setupMockFetch = () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUpdateAppResponse),
      });
  };

  const setupMockFetchForChangeset = () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockChangesetResponse),
    });
  };

  it("uses POST for updateApp", async () => {
    setupMockFetch();
    await clientTemp.updateApp({
      appId: QB_APP_ID,
      body: { name: "Test App" },
    });
    const apiCall = mockFetch.mock.calls.find((call) =>
      call[0].includes("/apps/")
    )![1];
    expect(apiCall.method).toBe("POST");
  });

  it("uses POST for runReport", async () => {
    setupMockFetch();
    await clientTemp.runReport({
      tableId: QB_APP_ID,
      reportId: "report1",
      body: { skip: 0, top: 10 },
    });
    const apiCall = mockFetch.mock.calls.find((call) =>
      call[0].includes("/reports/")
    )![1];
    expect(apiCall.method).toBe("POST");
  });

  it("uses PUT for changesetSolution", async () => {
    setupMockFetchForChangeset();
    await clientUser.changesetSolution({
      solutionId: "solution1",
      body: "name: Test Solution\nversion: 1.0",
    });
    const apiCall = mockFetch.mock.calls[0][1];
    expect(apiCall.method).toBe("PUT");
  });

  it("uses GET for getTable", async () => {
    setupMockFetch();
    await clientTemp.getTable({ appId: QB_APP_ID, tableId: "table1" });
    const apiCall = mockFetch.mock.calls.find((call) =>
      call[0].includes("/tables/")
    )![1];
    expect(apiCall.method).toBe("GET");
  });

  it("uses DELETE for deleteTable", async () => {
    setupMockFetch();
    await clientTemp.deleteTable({ appId: QB_APP_ID, tableId: "table1" });
    const apiCall = mockFetch.mock.calls.find((call) =>
      call[0].includes("/tables/")
    )![1];
    expect(apiCall.method).toBe("DELETE");
  });
});
