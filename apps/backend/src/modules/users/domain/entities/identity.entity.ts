import { OAuthProviderType } from '@/enums/oauth-provider-type.enum';

/**
 * Domain entity for OAuth identity (third-party authentication providers)
 * One user can have multiple OAuth identities (Google, Yandex, etc.)
 */
export class Identity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly providerType: OAuthProviderType,
    public readonly providerUserId: string,
    public readonly accessToken: string | undefined,
    public readonly refreshToken: string | undefined,
    public readonly tokenExpiresAt: Date | undefined,
    public readonly providerEmail: string | undefined,
    public readonly avatarUrl: string | undefined,
    public readonly metadata: Record<string, any> | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Create a new identity
   */
  static create(payload: {
    userId: string;
    providerType: OAuthProviderType;
    providerUserId: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    providerEmail?: string;
    avatarUrl?: string;
    metadata?: Record<string, any>;
  }): Omit<Identity, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId: payload.userId,
      providerType: payload.providerType,
      providerUserId: payload.providerUserId,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      tokenExpiresAt: payload.tokenExpiresAt,
      providerEmail: payload.providerEmail,
      avatarUrl: payload.avatarUrl,
      metadata: payload.metadata,
    } as Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>;
  }

  /**
   * Check if the access token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return false;
    return new Date() >= this.tokenExpiresAt;
  }

  /**
   * Check if the token needs refresh (within 5 minutes of expiry)
   */
  needsTokenRefresh(): boolean {
    if (!this.tokenExpiresAt) return false;
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return fiveMinutesFromNow >= this.tokenExpiresAt;
  }

  /**
   * Update tokens
   */
  updateTokens(payload: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }): Identity {
    const tokenExpiresAt = new Date(Date.now() + payload.expiresIn * 1000);

    return new Identity(
      this.id,
      this.userId,
      this.providerType,
      this.providerUserId,
      payload.accessToken,
      payload.refreshToken || this.refreshToken,
      tokenExpiresAt,
      this.providerEmail,
      this.avatarUrl,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }
}
