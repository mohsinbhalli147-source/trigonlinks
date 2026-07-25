import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getSupabaseClient } from '../database/client';
import { logger } from '../utils/logger';

const supabase = getSupabaseClient();

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}

class GoogleOAuthService {
  private oauth2Client: OAuth2Client;
  private config: GoogleOAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/settings/google/callback'
    };

    this.oauth2Client = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/contacts.other.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || ''
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{ tokens: any; userInfo: any }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user info using the OAuth2 client directly
      const { data: userInfo } = await this.oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });

      return { tokens, userInfo };
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Store OAuth tokens in database
   */
  async storeTokens(userId: number, tokens: any, email?: string): Promise<void> {
    try {
      const expiresAt = Date.now() + (tokens.expiry_date ? tokens.expiry_date - Date.now() : 3600000);

      const { error } = await supabase.from('google_oauth_tokens').upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokens.scope || '',
        email: email || null,
        is_active: true,
        updated_at: Date.now()
      }, {
        onConflict: 'user_id'
      });

      if (error) throw error;

      logger.info(`Google OAuth tokens stored for user ${userId}`);
    } catch (error) {
      logger.error('Error storing Google OAuth tokens:', error);
      throw error;
    }
  }

  /**
   * Get stored tokens for a user
   */
  async getStoredTokens(userId: number): Promise<StoredTokens | null> {
    try {
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        scope: data.scope
      };
    } catch (error) {
      logger.error('Error retrieving stored tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: number): Promise<string | null> {
    try {
      const storedTokens = await this.getStoredTokens(userId);
      if (!storedTokens) {
        return null;
      }

      this.oauth2Client.setCredentials({
        refresh_token: storedTokens.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update stored tokens
      const expiresAt = credentials.expiry_date 
        ? credentials.expiry_date 
        : Date.now() + 3600000;

      await supabase
        .from('google_oauth_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: expiresAt,
          updated_at: Date.now()
        })
        .eq('user_id', userId);

      logger.info(`Access token refreshed for user ${userId}`);
      return credentials.access_token;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      return null;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: number): Promise<string | null> {
    const storedTokens = await this.getStoredTokens(userId);
    
    if (!storedTokens) {
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    if (storedTokens.expires_at > Date.now() + 300000) {
      return storedTokens.access_token;
    }

    // Token is expired or will expire soon, refresh it
    return this.refreshAccessToken(userId);
  }

  /**
   * Revoke Google account connection
   */
  async revokeConnection(userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('google_oauth_tokens')
        .update({ is_active: false, updated_at: Date.now() })
        .eq('user_id', userId);

      if (error) throw error;

      logger.info(`Google connection revoked for user ${userId}`);
    } catch (error) {
      logger.error('Error revoking Google connection:', error);
      throw error;
    }
  }

  /**
   * Get connected Google account info
   */
  async getConnectedAccount(userId: number): Promise<{ email: string | null; connected: boolean }> {
    try {
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('email')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error || !data) {
        return { email: null, connected: false };
      }

      return { email: data.email, connected: true };
    } catch (error) {
      logger.error('Error getting connected account:', error);
      return { email: null, connected: false };
    }
  }

  /**
   * Check if Google is configured
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Get OAuth client with valid credentials
   */
  async getAuthenticatedClient(userId: number): Promise<OAuth2Client | null> {
    const accessToken = await this.getValidAccessToken(userId);
    
    if (!accessToken) {
      return null;
    }

    const client = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
    
    client.setCredentials({ access_token: accessToken });
    return client;
  }
}

export const googleOAuthService = new GoogleOAuthService();
