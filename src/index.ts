import axios, { AxiosInstance, AxiosResponse } from "axios";
import { Configuration, FieldsApi, AuthApi } from "./generated";

interface QuickBaseOptions {
  realm: string;
  userToken?: string;
  mode?: "development" | "production";
}

interface TokenData {
  token: string;
  expiry: number;
}

interface GetFieldsParams {
  tableId: string;
  includeFieldPerms?: boolean;
}

class QuickBaseClient {
  private axiosInstance: AxiosInstance;
  private authAxiosInstance: AxiosInstance;
  private config: Configuration;
  private fieldsApi: FieldsApi;
  private authApi: AuthApi;
  private tokens: Map<string, TokenData>;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private mode: "development" | "production";
  private realm: string;
  private userToken?: string;

  constructor(options: QuickBaseOptions) {
    const { realm, userToken, mode } = options;

    this.realm = realm;
    this.userToken = userToken;
    this.mode =
      mode ||
      (process.env.NODE_ENV as "development" | "production") ||
      "production";
    this.tokens = new Map();

    this.config = new Configuration({
      basePath: `https://api.quickbase.com/v1`,
    });

    this.axiosInstance = axios.create({
      baseURL: `https://api.quickbase.com/v1`,
      headers: {
        "QB-Realm-Hostname": `${realm}.quickbase.com`,
        ...(this.mode === "development" && userToken
          ? { Authorization: `QB-USER-TOKEN ${userToken}` }
          : {}),
      },
    });

    this.authAxiosInstance = axios.create({
      baseURL: `https://api.quickbase.com/v1`,
      headers: {
        "QB-Realm-Hostname": `${realm}.quickbase.com`,
      },
      withCredentials: true,
    });

    this.fieldsApi = new FieldsApi(this.config, undefined, this.axiosInstance);
    this.authApi = new AuthApi(this.config, undefined, this.authAxiosInstance);
  }

  private async ensureToken(dbid: string): Promise<string> {
    if (this.mode === "development") {
      if (!this.userToken)
        throw new Error("User token required in development mode");
      return this.userToken;
    }

    const tokenData = this.tokens.get(dbid);
    if (!tokenData || Date.now() > tokenData.expiry) {
      console.log(`Fetching temporary token for ${dbid}`);
      const response = await this.authApi.getTempTokenDBID(
        dbid,
        `${this.realm}.quickbase.com`
      );
      const token = response.data.temporaryAuthorization;
      if (!token) throw new Error("Temporary token missing in response");
      this.tokens.set(dbid, { token, expiry: Date.now() + 240000 });
      return token;
    }
    return tokenData.token;
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await request();
    }
    this.processing = false;
  }

  private async request<T>(
    apiCall: () => Promise<AxiosResponse<T>>,
    dbid?: string,
    queue = false
  ): Promise<T> {
    const authorization = dbid
      ? this.mode === "development"
        ? `QB-USER-TOKEN ${this.userToken}`
        : `QB-TEMP-TOKEN ${await this.ensureToken(dbid)}`
      : undefined;

    if (authorization) {
      this.axiosInstance.defaults.headers["Authorization"] = authorization;
    }

    const request = async () => {
      try {
        const response = await apiCall();
        return response.data;
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          dbid &&
          this.mode === "production"
        ) {
          console.log(`401 detected, refreshing token for ${dbid}`);
          this.tokens.delete(dbid);
          const newToken = await this.ensureToken(dbid);
          this.axiosInstance.defaults.headers["Authorization"] =
            `QB-TEMP-TOKEN ${newToken}`;
          return (await apiCall()).data;
        }
        console.error("API request failed:", {
          message: error instanceof Error ? error.message : String(error),
          status: axios.isAxiosError(error)
            ? error.response?.status
            : undefined,
          responseData: axios.isAxiosError(error)
            ? error.response?.data
            : undefined,
        });
        throw error;
      }
    };

    if (queue && dbid) {
      return new Promise<T>((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await request();
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
        this.processQueue();
      });
    }
    return request();
  }

  async getFields(
    params: GetFieldsParams,
    { queue = false } = {}
  ): Promise<any[]> {
    const { tableId, includeFieldPerms } = params;
    const apiCall = () =>
      this.fieldsApi.getFields(
        tableId,
        `${this.realm}.quickbase.com`,
        this.axiosInstance.defaults.headers["Authorization"] as string,
        includeFieldPerms
      );
    return this.request(apiCall, tableId, queue);
  }

  async getTempTokenDBID(dbid: string, { queue = false } = {}): Promise<any> {
    const apiCall = () =>
      this.authApi.getTempTokenDBID(dbid, `${this.realm}.quickbase.com`);
    return this.request(apiCall, dbid, queue);
  }
}

export default QuickBaseClient;
