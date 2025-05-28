// src/auth/credential-sources/credentialSources.ts
import { CredentialSource, Credentials } from "../types";

// TicketInMemorySessionSource (unchanged)
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

// TicketPromptSessionSource
export type TicketPromptCallback = () => Promise<Credentials>;

export interface LocalStorageSessionSourceConfig {
  storageKey?: string;
  debug?: boolean;
}

export interface TicketPromptSessionSourceConfig {
  promptCallback: TicketPromptCallback;
  debug?: boolean;
  localStorageConfig?: LocalStorageSessionSourceConfig;
}

export class TicketPromptSessionSource implements CredentialSource {
  private readonly promptCallback: TicketPromptCallback;
  private readonly debug: boolean;
  private readonly storageKey?: string;

  constructor(config: TicketPromptSessionSourceConfig) {
    this.promptCallback = config.promptCallback;
    this.debug = config.debug || false;
    this.storageKey = config.localStorageConfig?.storageKey; // Only set if localStorageConfig is provided
  }

  private getFromLocalStorage(): Credentials | null {
    if (
      typeof window === "undefined" ||
      !window.localStorage ||
      !this.storageKey
    ) {
      return null;
    }
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }
      const creds: Credentials = JSON.parse(stored);
      if (!creds.username || !creds.password || !creds.appToken) {
        return null;
      }
      return creds;
    } catch {
      return null;
    }
  }

  private setToLocalStorage(creds: Credentials): void {
    if (
      typeof window === "undefined" ||
      !window.localStorage ||
      !this.storageKey
    ) {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(creds));
  }

  private clearLocalStorage(): void {
    if (
      typeof window === "undefined" ||
      !window.localStorage ||
      !this.storageKey
    ) {
      return;
    }
    window.localStorage.removeItem(this.storageKey);
  }

  async getCredentials(): Promise<Credentials> {
    // Try localStorage first if configured
    if (this.storageKey) {
      const storedCreds = this.getFromLocalStorage();
      if (storedCreds) {
        if (this.debug) {
          console.log(
            "[TicketPromptSessionSource] Fetched credentials from localStorage"
          );
        }
        return storedCreds;
      }
      if (this.debug) {
        console.log(
          "[TicketPromptSessionSource] No valid credentials in localStorage, falling back to prompt"
        );
      }
    }

    // Fall back to client prompt
    try {
      const creds = await this.promptCallback();
      if (!creds.username || !creds.password || !creds.appToken) {
        throw new Error("Client prompt returned incomplete credentials");
      }
      // Store in localStorage if configured
      if (this.storageKey) {
        this.setToLocalStorage(creds);
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
    if (this.storageKey) {
      this.clearLocalStorage();
      if (this.debug) {
        console.log(
          "[TicketPromptSessionSource] Cleared localStorage for refresh"
        );
      }
    }
    return this.getCredentials();
  }

  clearCredentials(): void {
    if (this.storageKey) {
      this.clearLocalStorage();
      if (this.debug) {
        console.log("[TicketPromptSessionSource] Cleared stored credentials");
      }
    }
  }
}
