import { decode } from "jsonwebtoken";
import type {
    MSALCache,
    MSALClientCacheConfig,
    FetchTokenResponse,
    IdToken,
    LocalStorageBody,
    AccessTokenEntry,
    IdTokenEntry,
    RefreshTokenEntry,
} from "./index.d.js";

/**
 * returns an MSAL token cache that can be used for integration tests
 */
async function MSALClientCache({
    loginId,
    password,
    authority = "login.microsoftonline.com",
    tenantId,
    clientId,
    clientSecret,
    additionalScopes = "",
}: MSALClientCacheConfig): Promise<MSALCache> {
    /**
     * OAuth 2.0 Resource Owner Password Credentials (ROPC) grant to fill msal cache, so we don't test entra id login flow
     * Does not work with MFA enabled users.
     * @param scope string scope list
     * @return {*}
     */
    const fetchToken = (scope: string): Promise<FetchTokenResponse> =>
        fetch(`https://${authority}/${tenantId}/oauth2/v2.0/token`, {
            method: "POST",
            body: new URLSearchParams({
                grant_type: "password",
                client_id: clientId,
                client_secret: clientSecret,
                username: loginId,
                password,
                scope,
            }),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }).then((response) => {
            if (!response.ok) {
                throw new Error(
                    `HTTP error! ${response.status}: ${response.statusText}`,
                );
            }
            return response.json() as unknown as FetchTokenResponse;
        });

    // fetch oidc access token and can be used for ms graph api calls
    const {
        access_token: oidAccessToken,
        scope: oidcScope,
        id_token: idToken,
        ext_expires_in: oidTokenExtExpiresIn,
        expires_in: oidTokenExpiresIn,
    } = await fetchToken("User.Read profile openid email");

    // fetch service access token needs offline_access to also return a refresh token
    const {
        access_token: accessToken,
        scope: acTokenScope,
        ext_expires_in: acExtExpiresIn,
        expires_in: acExpiresIn,
        refresh_token: refreshToken,
    } = await fetchToken(
        `${clientId}/.default ${additionalScopes} offline_access`,
    );

    const {
        tid,
        oid,
        sid,
        preferred_username: username,
        name,
    } = decode(idToken) as IdToken;

    const localAccountId = oid ?? sid;
    const homeAccountId = `${localAccountId}.${tid ?? tenantId}`;

    const accountKey = `${homeAccountId}-${authority}-${tenantId}`;

    /**
     * generate msal cache for sessionStorage
     */
    const localStorageBody = (): LocalStorageBody => ({
        "msal.account.keys": [accountKey],
        [`msal.${clientId}.active-account`]: localAccountId,
        [`msal.token.keys.${clientId}`]: {
            accessToken: [
                `${homeAccountId}-${authority}-accesstoken-${clientId}-${tenantId}-${oidcScope.toLowerCase()}--`,
                `${homeAccountId}-${authority}-accesstoken-${clientId}-${tenantId}-${acTokenScope.toLowerCase()}--`,
            ],
            idToken: [
                `${homeAccountId}-${authority}-idtoken-${clientId}-${tenantId}---`,
            ],
            refreshToken: [
                `${homeAccountId}-${authority}-refreshtoken-${clientId}----`,
            ],
        },
        [`msal.${clientId}.active-account-filters`]: {
            homeAccountId,
            localAccountId,
            tenantId,
        },
        [accountKey]: {
            authorityType: "MSSTS",
            clientInfo: btoa(
                JSON.stringify({ uid: localAccountId, utid: tenantId }),
            ),
            environment: authority,
            realm: tenantId,
            tenantProfiles: [
                {
                    isHomeTenant: true,
                    localAccountId,
                    name,
                    tenantId,
                },
            ],
            homeAccountId,
            localAccountId,
            username,
            name,
        },
    });

    /**
     * Generate sessionStorage access token entry
     */
    const accessTokenEntry = (
        scopes: string,
        expiresIn: number,
        extExpiresIn: number,
        secret: string,
    ): AccessTokenEntry => ({
        [`${homeAccountId}-${authority}-accesstoken-${clientId}-${tenantId}-${scopes.toLowerCase()}--`]:
            {
                credentialType: "AccessToken",
                cachedAt: Math.round(Date.now() / 1000).toString(),
                expiresOn: (
                    Math.round(Date.now() / 1000) + expiresIn
                ).toString(),
                extendedExpiresOn: (
                    Math.round(Date.now() / 1000) + extExpiresIn
                ).toString(),
                environment: authority,
                realm: tenantId,
                target: scopes,
                tokenType: "Bearer",
                homeAccountId,
                secret,
                clientId,
            },
    });

    /**
     * id token entry
     */
    const idTokenEntry = (secret: string): IdTokenEntry => ({
        [`${homeAccountId}-${authority}-idtoken-${clientId}-${tenantId}---`]: {
            credentialType: "IdToken",
            environment: authority,
            realm: tenantId,
            homeAccountId,
            clientId,
            secret,
        },
    });

    /**
     * refresh token entry
     */
    const refreshTokenEntry = (secret: string): RefreshTokenEntry => ({
        [`${homeAccountId}-${authority}-refreshtoken-${clientId}----`]: {
            credentialType: "RefreshToken",
            environment: authority,
            clientId,
            homeAccountId,
            secret,
        },
    });

    return {
        ...localStorageBody(),
        ...accessTokenEntry(
            oidcScope,
            oidTokenExpiresIn,
            oidTokenExtExpiresIn,
            oidAccessToken,
        ),
        ...accessTokenEntry(
            acTokenScope,
            acExpiresIn,
            acExtExpiresIn,
            accessToken,
        ),
        ...idTokenEntry(idToken),
        ...refreshTokenEntry(refreshToken),
    } as MSALCache;
}

export default MSALClientCache;
