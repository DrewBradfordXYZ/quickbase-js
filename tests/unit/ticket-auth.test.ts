/**
 * Ticket Authentication unit tests
 *
 * XML-API-TICKET: Remove this file if XML API is discontinued.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../../src/index.js';
import { TicketStrategy } from '../../src/auth/ticket.js';
import type { AuthContext } from '../../src/auth/types.js';
import { createLogger } from '../../src/core/logger.js';

// Helper to create a mock fetch that returns XML auth response
function createMockAuthFetch(response: {
  errcode: number;
  errtext?: string;
  errdetail?: string;
  ticket?: string;
  userid?: string;
}) {
  const xml = `<?xml version="1.0" ?>
<qdbapi>
  <action>API_Authenticate</action>
  <errcode>${response.errcode}</errcode>
  <errtext>${response.errtext ?? 'No error'}</errtext>
  ${response.errdetail ? `<errdetail>${response.errdetail}</errdetail>` : ''}
  ${response.ticket ? `<ticket>${response.ticket}</ticket>` : ''}
  ${response.userid ? `<userid>${response.userid}</userid>` : ''}
</qdbapi>`;

  return vi.fn().mockResolvedValue(
    new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  );
}

// Helper to create auth context
function createAuthContext(fetchApi: typeof fetch): AuthContext {
  return {
    realm: 'testrealm',
    baseUrl: 'https://api.quickbase.com/v1',
    fetchApi,
    logger: createLogger(false),
  };
}

describe('TicketStrategy', () => {
  describe('authentication', () => {
    it('should authenticate successfully with username and password', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket_abc123',
        userid: '12345.abcd',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password123',
        undefined,
        createAuthContext(mockFetch)
      );

      const token = await strategy.getToken();

      expect(token).toBe('test_ticket_abc123');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify request format
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://testrealm.quickbase.com/db/main');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/xml');
      expect(options.headers['QUICKBASE-ACTION']).toBe('API_Authenticate');
      expect(options.body).toContain('<username>user@example.com</username>');
      expect(options.body).toContain('<password>password123</password>');
      expect(options.body).toContain('<hours>12</hours>'); // Default
    });

    it('should use custom hours option', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        { hours: 24 },
        createAuthContext(mockFetch)
      );

      await strategy.getToken();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toContain('<hours>24</hours>');
    });

    it('should clamp hours to max bound', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        { hours: 10000 },
        createAuthContext(mockFetch)
      );
      await strategy.getToken();
      expect(mockFetch.mock.calls[0][1].body).toContain('<hours>4380</hours>');
    });

    it('should clamp hours to min bound', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        { hours: 0 },
        createAuthContext(mockFetch)
      );
      await strategy.getToken();
      expect(mockFetch.mock.calls[0][1].body).toContain('<hours>1</hours>');
    });

    it('should handle authentication failure', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 20,
        errtext: 'Unknown username/password',
        errdetail: "Sorry! Something's wrong with your sign-in info.",
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'wrongpassword',
        undefined,
        createAuthContext(mockFetch)
      );

      await expect(strategy.getToken()).rejects.toThrow(
        "Sorry! Something's wrong with your sign-in info"
      );
    });

    it('should handle empty ticket response', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: '',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        undefined,
        createAuthContext(mockFetch)
      );

      await expect(strategy.getToken()).rejects.toThrow(
        'No ticket returned from API_Authenticate'
      );
    });
  });

  describe('token caching', () => {
    it('should cache ticket after successful auth', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'cached_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        undefined,
        createAuthContext(mockFetch)
      );

      // First call - should authenticate
      const token1 = await strategy.getToken();
      // Second call - should use cache
      const token2 = await strategy.getToken();

      expect(token1).toBe('cached_ticket');
      expect(token2).toBe('cached_ticket');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one auth call
    });
  });

  describe('password security', () => {
    it('should clear password after authentication', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'secret_password',
        undefined,
        createAuthContext(mockFetch)
      );

      await strategy.getToken();

      // After auth, calling handleAuthError and then getToken should fail
      // because password was cleared
      strategy.invalidate();
      await strategy.handleAuthError();

      await expect(strategy.getToken()).rejects.toThrow(
        'Ticket expired; create a new client with fresh credentials'
      );

      // Auth should NOT be called again
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorization header', () => {
    it('should return QB-TICKET format', () => {
      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        undefined,
        createAuthContext(vi.fn())
      );

      expect(strategy.getAuthorizationHeader('my_ticket')).toBe(
        'QB-TICKET my_ticket'
      );
    });
  });

  describe('XML escaping', () => {
    it('should escape special characters in credentials', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '12345',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'pass<>&"\'word',
        undefined,
        createAuthContext(mockFetch)
      );

      await strategy.getToken();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toContain('&lt;');
      expect(options.body).toContain('&gt;');
      expect(options.body).toContain('&amp;');
      expect(options.body).toContain('&quot;');
      expect(options.body).toContain('&apos;');
      expect(options.body).not.toContain('pass<>&');
    });
  });

  describe('getUserId', () => {
    it('should return null before auth', () => {
      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        undefined,
        createAuthContext(vi.fn())
      );

      expect(strategy.getUserId()).toBeNull();
    });

    it('should return user ID after auth', async () => {
      const mockFetch = createMockAuthFetch({
        errcode: 0,
        ticket: 'test_ticket',
        userid: '99999.wxyz',
      });

      const strategy = new TicketStrategy(
        'user@example.com',
        'password',
        undefined,
        createAuthContext(mockFetch)
      );

      await strategy.getToken();

      expect(strategy.getUserId()).toBe('99999.wxyz');
    });
  });
});

describe('onExpired callback', () => {
  it('should call onExpired when ticket expires after auth', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'test_ticket',
      userid: '12345',
    });

    const onExpired = vi.fn();
    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { onExpired },
      createAuthContext(mockFetch)
    );

    // First auth succeeds
    await strategy.getToken();
    expect(onExpired).not.toHaveBeenCalled();

    // Simulate ticket expiration
    strategy.invalidate();
    await strategy.handleAuthError();

    // Now getToken should fail and call onExpired
    await expect(strategy.getToken()).rejects.toThrow('Ticket expired');
    expect(onExpired).toHaveBeenCalledTimes(2); // Once in handleAuthError, once in getToken
  });

  it('should call onExpired in handleAuthError', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'test_ticket',
      userid: '12345',
    });

    const onExpired = vi.fn();
    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { onExpired },
      createAuthContext(mockFetch)
    );

    await strategy.getToken();
    const canRetry = await strategy.handleAuthError();

    expect(canRetry).toBe(false);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('should not throw if onExpired is not provided', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'test_ticket',
      userid: '12345',
    });

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      undefined,
      createAuthContext(mockFetch)
    );

    await strategy.getToken();
    strategy.invalidate();

    // Should not throw due to missing onExpired
    await strategy.handleAuthError();
    await expect(strategy.getToken()).rejects.toThrow('Ticket expired');
  });
});

describe('createClient with ticket auth', () => {
  it('should create client with ticket auth config', () => {
    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'ticket',
        username: 'user@example.com',
        password: 'password123',
      },
    });

    expect(client).toBeDefined();
    expect(client.request).toBeInstanceOf(Function);
  });

  it('should create client with custom hours', () => {
    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'ticket',
        username: 'user@example.com',
        password: 'password123',
        hours: 48,
      },
    });

    expect(client).toBeDefined();
  });

  it('should create client with onExpired callback', () => {
    const onExpired = vi.fn();
    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'ticket',
        username: 'user@example.com',
        password: 'password123',
        onExpired,
      },
    });

    expect(client).toBeDefined();
  });

  it('should create client with persist option', () => {
    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'ticket',
        username: 'user@example.com',
        password: 'password123',
        persist: 'sessionStorage',
      },
    });

    expect(client).toBeDefined();
  });
});

describe('ticket persistence', () => {
  // Mock storage
  let mockStorage: Map<string, string>;
  let mockStorageObject: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };

  beforeEach(() => {
    mockStorage = new Map();
    mockStorageObject = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
    };

    // Mock globalThis.sessionStorage
    vi.stubGlobal('sessionStorage', mockStorageObject);
    vi.stubGlobal('localStorage', mockStorageObject);
  });

  it('should save ticket to storage after authentication', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'persisted_ticket',
      userid: '12345',
    });

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { persist: 'sessionStorage' },
      createAuthContext(mockFetch)
    );

    await strategy.getToken();

    const stored = mockStorage.get('qb_ticket_testrealm');
    expect(stored).toBeDefined();

    const data = JSON.parse(stored!);
    expect(data.ticket).toBe('persisted_ticket');
    expect(data.userId).toBe('12345');
    expect(data.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should restore ticket from storage on construction', async () => {
    // Pre-populate storage with a valid ticket
    const futureExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
    mockStorage.set(
      'qb_ticket_testrealm',
      JSON.stringify({
        ticket: 'restored_ticket',
        userId: '99999',
        expiresAt: futureExpiry,
      })
    );

    const mockFetch = vi.fn(); // Should not be called

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { persist: 'sessionStorage' },
      createAuthContext(mockFetch)
    );

    const token = await strategy.getToken();

    expect(token).toBe('restored_ticket');
    expect(strategy.getUserId()).toBe('99999');
    expect(mockFetch).not.toHaveBeenCalled(); // No auth request made
  });

  it('should not restore expired ticket from storage', async () => {
    // Pre-populate storage with an expired ticket
    const pastExpiry = Date.now() - 1000; // Already expired
    mockStorage.set(
      'qb_ticket_testrealm',
      JSON.stringify({
        ticket: 'expired_ticket',
        userId: '99999',
        expiresAt: pastExpiry,
      })
    );

    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'new_ticket',
      userid: '12345',
    });

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { persist: 'sessionStorage' },
      createAuthContext(mockFetch)
    );

    const token = await strategy.getToken();

    expect(token).toBe('new_ticket'); // Fresh auth was performed
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should clear ticket from storage on invalidate', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'test_ticket',
      userid: '12345',
    });

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { persist: 'sessionStorage' },
      createAuthContext(mockFetch)
    );

    await strategy.getToken();
    expect(mockStorage.has('qb_ticket_testrealm')).toBe(true);

    strategy.invalidate();
    expect(mockStorage.has('qb_ticket_testrealm')).toBe(false);
  });

  it('should clear ticket from storage on handleAuthError', async () => {
    const mockFetch = createMockAuthFetch({
      errcode: 0,
      ticket: 'test_ticket',
      userid: '12345',
    });

    const strategy = new TicketStrategy(
      'user@example.com',
      'password',
      { persist: 'sessionStorage' },
      createAuthContext(mockFetch)
    );

    await strategy.getToken();
    expect(mockStorage.has('qb_ticket_testrealm')).toBe(true);

    await strategy.handleAuthError();
    expect(mockStorage.has('qb_ticket_testrealm')).toBe(false);
  });
});
