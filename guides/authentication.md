# Authentication

## User token

```typescript
createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'b9f3pk_xxx' } });
```

For servers and scripts. Create one at `https://YOUR-REALM.quickbase.com/db/main?a=UserTokens`; changes made with it are attributed to its owner. Keep it out of browser code.

## Temporary tokens

```typescript
createClient({ realm: 'mycompany', auth: { type: 'temp-token' } });
```

For browser code inside QuickBase, such as code pages. The client fetches a temporary token for each table or app it calls, using the signed-in user's session, so your code holds no secret and every call has that user's permissions. Tokens last five minutes; the client caches them and fetches a new one shortly before expiry, or after an unexpected 401. It finds the table or app from each request (`from`, `to`, `tableId`, `appId`, or the path), so there is nothing to configure.

A server can receive these tokens from the browser instead: see [quickbase-go](https://github.com/DrewBradfordXYZ/quickbase-go/blob/main/docs/authentication.md#temporary-tokens).

## Ticket

```typescript
createClient({
  realm: 'mycompany',
  auth: {
    type: 'ticket',
    username: 'user@example.com',
    password: 'from-a-login-form',
    hours: 24,
    persist: 'sessionStorage',
    onExpired: () => {
      window.location.href = '/login';
    },
  },
  appToken: 'app-token', // XML API calls only
});
```

A user's email and password, exchanged for a ticket on the first call; the password is dropped from memory once the sign-in succeeds. Records they change show them as the creator or modifier. A ticket lasts `hours` (default 12, up to about six months). `persist` keeps it across page reloads (`'sessionStorage'` or `'localStorage'`), and `onExpired` runs when it lapses.

## SSO

```typescript
createClient({ realm: 'mycompany', auth: { type: 'sso', samlToken: 'base64url-saml-assertion' } });
```

With SAML SSO set up for the realm, a SAML assertion from your identity provider is exchanged for a token that acts as that user ([token exchange](https://developer.quickbase.com/operation/exchangeSsoToken)).

## App tokens

An app with **Require Application Tokens** checks them on XML API calls made with a ticket or temporary token. User tokens skip the check, and the JSON API never uses app tokens. Set `appToken` on the client, or `createXmlClient(qb, { appToken })`.
