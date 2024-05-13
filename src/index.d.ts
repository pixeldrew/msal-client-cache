import type { JwtPayload } from "jsonwebtoken";

export type MSALClientCacheConfig = {
    loginId: string;
    password: string;
    authority: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    additionalScopes?: string;
};

export type AccessTokenEntry = {
    [key: string]: {
        credentialType: string;
        environment: string;
        extendedExpiresOn: string;
        clientId: string;
        expiresOn: string;
        realm: string;
        secret: string;
        cachedAt: string;
        tokenType: string;
        homeAccountId: string;
        target: string;
    };
};

export type LocalStorageBody = {
    [key: string]:
        | string
        | string[]
        | { idToken: [string]; accessToken: string[]; refreshToken: [string] }
        | { tenantId: string; localAccountId: string; homeAccountId: string }
        | {
              environment: string;
              name: string;
              clientInfo: string;
              realm: string;
              authorityType: string;
              localAccountId: string;
              homeAccountId: string;
              username: string;
              tenantProfiles: [
                  {
                      name: string;
                      tenantId: string;
                      localAccountId: string;
                      isHomeTenant: boolean;
                  },
              ];
          };
    "msal.account.keys": string[];
};

export type FetchTokenResponse = {
    access_token: string;
    scope: string;
    id_token: string;
    ext_expires_in: number;
    expires_in: number;
    refresh_token: string;
};

export type IdToken = JwtPayload & {
    tid: string;
    oid: string;
    sid: string;
    preferred_username: string;
    name: string;
};

export type IdTokenEntry = {
    [key: string]: {
        credentialType: string;
        environment: string;
        clientId: string;
        realm: string;
        secret: string;
        homeAccountId: string;
    };
};

export type RefreshTokenEntry = {
    [key: string]: {
        credentialType: string;
        environment: string;
        clientId: string;
        secret: string;
        homeAccountId: string;
    };
};

export type MSALCache = LocalStorageBody &
    AccessTokenEntry &
    IdTokenEntry &
    RefreshTokenEntry;

export default function MSALClientCache(
    config: MSALClientCacheConfig,
): Promise<MSALCache>;
