# msal-client-cache

This library is used to generate a functioning token cache for Microsofts MSAL library. It works by requesting an ROPC token on the server and you use the cache to test your app with an end to end testing tool like playwright.

Default OIDC scopes are requested `openid profile offline_access`. An access token for `<client-id>/.default` is also requested, this is sufficed for most MSAL SPA applications. If you require additional scopes you can add them into additionalScopes option.

Caveats to this library: Users with MFA enabled will not be able to use this library. This is because the ROPC flow does not support users with MFA.

ROPC is not recommended for production users. This library is intended for testing purposes only.

## Installation

```bash
npm i msal-client-cache
```

## Use

```js
import MSALClientCache from "msal-client-cache";

const sessionStore = await MSALClientCache({
    loginId, // upn of user to request token for
    password, // password of user to request token for
    authority, // authority of tenant defaults to login.windows.net
    tenantId, // tenantId of tenant
    clientId, // entra id client id of app
    clientSecret, // client secret of app (client secret is required for ROPC flow)
    additionalScopes // additional scopes to request, defaulted to empty
});

// then you can embedd the sessionStore in your selenium/puppeteer or playwright tests
```

## Changelog

The changelog can be found on the [Releases page](https://github.com/pixeldrew/msal-client-cache/releases).

## Contributing

Everyone is welcome to contribute. Please take a moment to review the [contributing guidelines](CONTRIBUTING.md).

## Authors and license

Drew Foehn and [contributors](https://github.com/pixeldrew/msal-client-cache/graphs/contributors).

MIT License, see the included [License.md](License.md) file.
