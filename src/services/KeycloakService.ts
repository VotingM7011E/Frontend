import Keycloak from 'keycloak-js';
import { keycloakConfig } from '../keycloak-config';

/**
 * Keycloak Service
 * Handles authentication through Keycloak
 */
class KeycloakService {
  private keycloak: Keycloak | null = null;
  private initialized = false;

  /**
   * Initialize Keycloak instance
   */
  async init(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    this.keycloak = new Keycloak({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId,
    });

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });

      this.initialized = true;

      // Setup token refresh
      if (authenticated) {
        this.setupTokenRefresh();
      }

      return authenticated;
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      throw error;
    }
  }

  /**
   * Login redirect to Keycloak
   */
  login(): void {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    this.keycloak.login();
  }

  /**
   * Logout
   */
  logout(): void {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    this.keycloak.logout();
  }

  /**
   * Get current access token
   */
  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  /**
   * Get user profile information
   */
  async getUserProfile() {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const profile = await this.keycloak.loadUserProfile();
      return {
        id: profile.id || '',
        username: profile.username || '',
        email: profile.email || '',
        firstName: profile.firstName,
        lastName: profile.lastName,
      };
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.keycloak?.authenticated || false;
  }

  /**
   * Update token before making API calls
   */
  async updateToken(minValidity: number = 5): Promise<boolean> {
    if (!this.keycloak) {
      return false;
    }

    try {
      const refreshed = await this.keycloak.updateToken(minValidity);
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    if (!this.keycloak) return;

    // Refresh token every 30 seconds if it will expire in next 60 seconds
    setInterval(() => {
      this.updateToken(60).catch((error) => {
        console.error('Token refresh failed:', error);
        // Token expired, redirect to login
        this.login();
      });
    }, 30000);
  }

  /**
   * Get Keycloak instance (for advanced usage)
   */
  getInstance(): Keycloak | null {
    return this.keycloak;
  }
}

export default new KeycloakService();
