// src/auth/credential-sources/credentialSources.ts
import { CredentialSource, Credentials } from "../types";

// TicketInMemorySessionSource
export class TicketInMemorySessionSource implements CredentialSource {
  private credentials: Credentials | null = null;
  private debug: boolean;

  constructor(initialCredentials?: Credentials, debug: boolean = false) {
    this.credentials = initialCredentials || null;
    this.debug = debug;
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.credentials) {
      throw new Error("No credentials set in session");
    }
    if (this.debug) {
      console.log(
        "[TicketInMemorySessionSource] Fetched credentials from session"
      );
    }
    return this.credentials;
  }

  async refreshCredentials(): Promise<Credentials> {
    if (this.debug) {
      console.log(
        "[TicketInMemorySessionSource] Refreshing credentials from session"
      );
    }
    return this.getCredentials();
  }

  setCredentials(creds: Credentials): void {
    this.credentials = creds;
    if (this.debug) {
      console.log("[TicketInMemorySessionSource] Set credentials in session");
    }
  }

  clearCredentials(): void {
    this.credentials = null;
    if (this.debug) {
      console.log(
        "[TicketInMemorySessionSource] Cleared credentials from session"
      );
    }
  }
}

// TicketLocalStorageSessionSource
export interface LocalStorageSessionSourceConfig {
  storageKey?: string;
  debug?: boolean;
}

export class TicketLocalStorageSessionSource implements CredentialSource {
  private storageKey: string;
  private debug: boolean;

  constructor(config: LocalStorageSessionSourceConfig = {}) {
    this.storageKey = config.storageKey || "quickbase-credentials";
    this.debug = config.debug || false;
  }

  async getCredentials(): Promise<Credentials> {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) {
        throw new Error("No credentials found in localStorage");
      }
      const creds: Credentials = JSON.parse(stored);
      if (!creds.username || !creds.password || !creds.appToken) {
        throw new Error("Incomplete credentials in localStorage");
      }
      if (this.debug) {
        console.log(
          "[TicketLocalStorageSessionSource] Fetched credentials from localStorage"
        );
      }
      return creds;
    } catch (error: unknown) {
      if (this.debug) {
        console.error(
          "[TicketLocalStorageSessionSource] Failed to fetch credentials:",
          error
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`localStorage error: ${errorMessage}`);
    }
  }

  async refreshCredentials(): Promise<Credentials> {
    if (this.debug) {
      console.log(
        "[TicketLocalStorageSessionSource] Refreshing credentials from localStorage"
      );
    }
    return this.getCredentials();
  }

  setCredentials(creds: Credentials): void {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(creds));
    if (this.debug) {
      console.log(
        "[TicketLocalStorageSessionSource] Stored credentials in localStorage"
      );
    }
  }

  clearCredentials(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.storageKey);
    if (this.debug) {
      console.log(
        "[TicketLocalStorageSessionSource] Cleared credentials from localStorage"
      );
    }
  }
}

// TicketPromptSessionSource
export type TicketPromptCallback = () => Promise<Credentials>;

export interface TicketPromptSessionSourceConfig {
  promptCallback: TicketPromptCallback;
  debug?: boolean;
  localStorageConfig?: LocalStorageSessionSourceConfig;
}

export class TicketPromptSessionSource implements CredentialSource {
  private readonly promptCallback: TicketPromptCallback;
  private readonly debug: boolean;
  private readonly localStorageSource?: TicketLocalStorageSessionSource;

  constructor(config: TicketPromptSessionSourceConfig) {
    this.promptCallback = config.promptCallback;
    this.debug = config.debug || false;
    if (config.localStorageConfig) {
      this.localStorageSource = new TicketLocalStorageSessionSource({
        ...config.localStorageConfig,
        debug: config.localStorageConfig.debug || this.debug,
      });
    }
  }

  async getCredentials(): Promise<Credentials> {
    // Try localStorage first if configured
    if (this.localStorageSource) {
      try {
        const creds = await this.localStorageSource.getCredentials();
        if (this.debug) {
          console.log(
            "[TicketPromptSessionSource] Fetched credentials from localStorage"
          );
        }
        return creds;
      } catch (error: unknown) {
        if (this.debug) {
          console.log(
            "[TicketPromptSessionSource] No valid credentials in localStorage, falling back to prompt:",
            error
          );
        }
      }
    }

    // Fall back to client prompt
    try {
      const creds = await this.promptCallback();
      if (!creds.username || !creds.password || !creds.appToken) {
        throw new Error("Client prompt returned incomplete credentials");
      }
      // Store in localStorage if configured
      if (this.localStorageSource) {
        this.localStorageSource.setCredentials(creds);
        if (this.debug) {
          console.log(
            "[TicketPromptSessionSource] Stored prompted credentials in localStorage"
          );
        }
      }
      if (this.debug) {
        console.log(
          "[TicketPromptSessionSource] Fetched credentials from client prompt"
        );
      }
      return creds;
    } catch (error: unknown) {
      if (this.debug) {
        console.error(
          "[TicketPromptSessionSource] Failed to fetch credentials:",
          error
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Client prompt error: ${errorMessage}`);
    }
  }

  async refreshCredentials(): Promise<Credentials> {
    if (this.debug) {
      console.log("[TicketPromptSessionSource] Refreshing credentials");
    }
    // If using localStorage, clear it to force a new prompt
    if (this.localStorageSource) {
      this.localStorageSource.clearCredentials();
      if (this.debug) {
        console.log(
          "[TicketPromptSessionSource] Cleared localStorage for refresh"
        );
      }
    }
    return this.getCredentials();
  }

  clearCredentials(): void {
    if (this.localStorageSource) {
      this.localStorageSource.clearCredentials();
      if (this.debug) {
        console.log("[TicketPromptSessionSource] Cleared stored credentials");
      }
    }
  }
}
