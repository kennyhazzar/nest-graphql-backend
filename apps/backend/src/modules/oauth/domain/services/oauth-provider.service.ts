/**
 * User information returned from OAuth provider
 */
export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

/**
 * OAuth tokens returned from provider
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Abstract OAuth provider service
 * Implement this interface for each OAuth provider (Google, Yandex, etc.)
 */
export abstract class OAuthProviderService {
  /**
   * Get authorization URL for OAuth flow
   */
  abstract getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange authorization code for access token
   */
  abstract exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Get user information from provider
   */
  abstract getUserInfo(accessToken: string): Promise<OAuthUserInfo>;

  /**
   * Refresh access token
   */
  abstract refreshToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Revoke access token
   */
  abstract revokeToken(token: string): Promise<void>;
}
