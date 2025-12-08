/**
 * Configuration resolution and validation
 */

import type { QuickbaseConfig, ResolvedConfig, RetryConfig } from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import { resolveSchema } from './schema.js';

/**
 * Resolve user configuration with defaults
 */
export function resolveConfig(config: QuickbaseConfig): ResolvedConfig {
  validateConfig(config);

  const retry: Required<RetryConfig> = {
    maxAttempts: config.rateLimit?.retry?.maxAttempts ?? DEFAULT_CONFIG.retry.maxAttempts,
    initialDelayMs: config.rateLimit?.retry?.initialDelayMs ?? DEFAULT_CONFIG.retry.initialDelayMs,
    maxDelayMs: config.rateLimit?.retry?.maxDelayMs ?? DEFAULT_CONFIG.retry.maxDelayMs,
    multiplier: config.rateLimit?.retry?.multiplier ?? DEFAULT_CONFIG.retry.multiplier,
  };

  const proactiveThrottle = {
    enabled: config.rateLimit?.proactiveThrottle?.enabled ?? DEFAULT_CONFIG.proactiveThrottle.enabled,
    requestsPer10Seconds:
      config.rateLimit?.proactiveThrottle?.requestsPer10Seconds ??
      DEFAULT_CONFIG.proactiveThrottle.requestsPer10Seconds,
  };

  return {
    realm: config.realm,
    baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    debug: config.debug ?? DEFAULT_CONFIG.debug,
    fetchApi: config.fetchApi ?? globalThis.fetch.bind(globalThis),
    auth: config.auth,
    retry,
    proactiveThrottle,
    onRateLimit: config.rateLimit?.onRateLimit,
    autoPaginate: config.autoPaginate ?? DEFAULT_CONFIG.autoPaginate,
    convertDates: config.convertDates ?? DEFAULT_CONFIG.convertDates,
    schema: resolveSchema(config.schema),
    readOnly: config.readOnly ?? false,
    appToken: config.appToken,
  };
}

/**
 * Validate configuration and throw if invalid
 */
function validateConfig(config: QuickbaseConfig): void {
  if (!config.realm) {
    throw new Error('QuickBase realm is required');
  }

  if (typeof config.realm !== 'string') {
    throw new Error('QuickBase realm must be a string');
  }

  // Remove .quickbase.com suffix if provided
  if (config.realm.includes('.')) {
    throw new Error(
      'Realm should be just the subdomain (e.g., "mycompany" not "mycompany.quickbase.com")'
    );
  }

  if (!config.auth) {
    throw new Error('Authentication configuration is required');
  }

  validateAuthConfig(config.auth);

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      throw new Error('Timeout must be a positive number');
    }
  }

  if (config.rateLimit?.retry) {
    validateRetryConfig(config.rateLimit.retry);
  }

  if (config.rateLimit?.proactiveThrottle) {
    validateThrottleConfig(config.rateLimit.proactiveThrottle);
  }
}

function validateAuthConfig(auth: QuickbaseConfig['auth']): void {
  switch (auth.type) {
    case 'user-token':
      if (!auth.userToken) {
        throw new Error('User token is required for user-token auth');
      }
      break;

    case 'temp-token':
      // userToken is optional for temp-token auth
      // When running in Code Pages, the browser session is used
      break;

    case 'sso':
      if (!auth.samlToken) {
        throw new Error('SAML token is required for SSO auth');
      }
      break;

    // XML-API-TICKET: Remove this case if XML API is discontinued
    case 'ticket':
      if (!auth.username) {
        throw new Error('Username is required for ticket auth');
      }
      if (!auth.password) {
        throw new Error('Password is required for ticket auth');
      }
      break;

    default:
      throw new Error(`Unknown auth type: ${(auth as { type: string }).type}`);
  }
}

function validateRetryConfig(retry: RetryConfig): void {
  if (retry.maxAttempts !== undefined) {
    if (typeof retry.maxAttempts !== 'number' || retry.maxAttempts < 0) {
      throw new Error('maxAttempts must be a non-negative number');
    }
  }

  if (retry.initialDelayMs !== undefined) {
    if (typeof retry.initialDelayMs !== 'number' || retry.initialDelayMs < 0) {
      throw new Error('initialDelayMs must be a non-negative number');
    }
  }

  if (retry.maxDelayMs !== undefined) {
    if (typeof retry.maxDelayMs !== 'number' || retry.maxDelayMs < 0) {
      throw new Error('maxDelayMs must be a non-negative number');
    }
  }

  if (retry.multiplier !== undefined) {
    if (typeof retry.multiplier !== 'number' || retry.multiplier < 1) {
      throw new Error('multiplier must be a number >= 1');
    }
  }
}

function validateThrottleConfig(throttle: { enabled?: boolean; requestsPer10Seconds?: number }): void {
  if (throttle.requestsPer10Seconds !== undefined) {
    if (typeof throttle.requestsPer10Seconds !== 'number' || throttle.requestsPer10Seconds <= 0) {
      throw new Error('requestsPer10Seconds must be a positive number');
    }
  }
}

/**
 * Build the realm hostname from the realm name
 */
export function getRealmHostname(realm: string): string {
  return `${realm}.quickbase.com`;
}
