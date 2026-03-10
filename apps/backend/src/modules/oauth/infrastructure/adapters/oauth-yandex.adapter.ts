import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OAuthProviderService, OAuthTokens, OAuthUserInfo } from '../../domain/services/oauth-provider.service';

/**
 * Yandex OAuth 2.0 adapter implementation
 */
@Injectable()
export class OAuthYandexAdapter extends OAuthProviderService {
  private readonly logger = new Logger(OAuthYandexAdapter.name);
  private readonly clientId?: string;
  private readonly clientSecret?: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.clientId = this.configService.get('oauth.providers.yandex.clientId');
    this.clientSecret = this.configService.get('oauth.providers.yandex.clientSecret');
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private requireConfig(): void {
    if (!this.isConfigured()) {
      throw new NotImplementedException('Yandex OAuth provider is not configured');
    }
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    this.requireConfig();
    const params = new URLSearchParams({
      client_id: this.clientId!,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      force_confirm: 'yes',
    });

    return `https://oauth.yandex.ru/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokens> {
    this.requireConfig();
    try {
      const response = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Yandex token exchange failed: ${error}`);
        throw new Error(`Yandex token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error exchanging Yandex authorization code', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    this.requireConfig();
    try {
      const response = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: `OAuth ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Yandex userinfo failed: ${error}`);
        throw new Error(`Yandex userinfo failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Construct avatar URL if avatar_id is present
      let avatarUrl: string | undefined;
      if (data.default_avatar_id) {
        avatarUrl = `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`;
      }

      return {
        id: data.id,
        email: data.default_email,
        name: data.display_name || data.real_name,
        avatar: avatarUrl,
        metadata: {
          login: data.login,
          first_name: data.first_name,
          last_name: data.last_name,
          sex: data.sex,
          birthday: data.birthday,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching Yandex user info', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    this.requireConfig();
    try {
      const response = await fetch('https://oauth.yandex.ru/token', {
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
        this.logger.error(`Yandex token refresh failed: ${error}`);
        throw new Error(`Yandex token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error refreshing Yandex token', error);
      throw error;
    }
  }

  async revokeToken(token: string): Promise<void> {
    // Yandex doesn't support token revocation via API
    // Tokens will expire naturally
    this.logger.debug('Yandex does not support token revocation');
  }
}
