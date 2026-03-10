import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OAuthProviderService, OAuthTokens, OAuthUserInfo } from '../../domain/services/oauth-provider.service';

/**
 * Google OAuth 2.0 adapter implementation
 */
@Injectable()
export class OAuthGoogleAdapter extends OAuthProviderService {
  private readonly logger = new Logger(OAuthGoogleAdapter.name);
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly scopes: string[];

  constructor(private readonly configService: ConfigService) {
    super();
    this.clientId = this.configService.get('oauth.providers.google.clientId');
    this.clientSecret = this.configService.get('oauth.providers.google.clientSecret');
    this.scopes = this.configService.get('oauth.providers.google.scopes', [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]);
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private requireConfig(): void {
    if (!this.isConfigured()) {
      throw new NotImplementedException('Google OAuth provider is not configured');
    }
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    this.requireConfig();
    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    this.requireConfig();
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Google token exchange failed: ${error}`);
        throw new Error(`Google token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error exchanging Google authorization code', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    this.requireConfig();
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Google userinfo failed: ${error}`);
        throw new Error(`Google userinfo failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.picture,
        metadata: {
          locale: data.locale,
          verified_email: data.verified_email,
          given_name: data.given_name,
          family_name: data.family_name,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching Google user info', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    this.requireConfig();
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Google token refresh failed: ${error}`);
        throw new Error(`Google token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error refreshing Google token', error);
      throw error;
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        this.logger.warn(`Google token revocation failed: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.warn('Error revoking Google token', error);
      // Don't throw - revocation is best-effort
    }
  }
}
