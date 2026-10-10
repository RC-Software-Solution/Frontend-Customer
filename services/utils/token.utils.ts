/**
 * Token Utilities
 * JWT helpers + token storage (encrypted via the OS Keychain/Keystore)
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';

const { ACCESS_TOKEN, REFRESH_TOKEN } = API_CONFIG.STORAGE_KEYS;

export class TokenUtils {
  /** In-flight refresh, shared so parallel 401s trigger only one renewal */
  private static refreshing: Promise<string | null> | null = null;

  /**
   * Check if a JWT token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Assume expired if can't decode
    }
  }

  /** Read from SecureStore; on first run move a token saved by older versions out of AsyncStorage */
  private static async read(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) return value;
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      }
      return legacy;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  private static async remove(key: string): Promise<void> {
    try {
      await Promise.all([SecureStore.deleteItemAsync(key), AsyncStorage.removeItem(key)]);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  static getAccessToken(): Promise<string | null> {
    return this.read(ACCESS_TOKEN);
  }

  static getRefreshToken(): Promise<string | null> {
    return this.read(REFRESH_TOKEN);
  }

  static saveAccessToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(ACCESS_TOKEN, token);
  }

  static saveRefreshToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(REFRESH_TOKEN, token);
  }

  /**
   * Save both tokens to storage
   */
  static async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        this.saveAccessToken(accessToken),
        this.saveRefreshToken(refreshToken),
      ]);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  static removeAccessToken(): Promise<void> {
    return this.remove(ACCESS_TOKEN);
  }

  static removeRefreshToken(): Promise<void> {
    return this.remove(REFRESH_TOKEN);
  }

  /**
   * Remove all tokens from storage
   */
  static async clearTokens(): Promise<void> {
    await Promise.all([this.removeAccessToken(), this.removeRefreshToken()]);
  }

  /**
   * Exchange the refresh token for a new access token.
   * Resolves to the new token, or null if the server rejected the refresh token.
   * Throws on network errors, so callers can keep the session while offline.
   */
  static refresh(): Promise<string | null> {
    this.refreshing ??= (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) return null;

        // Plain axios (not BaseApiClient) so this call can't trigger its own refresh
        const { data } = await axios.post(
          `${API_CONFIG.BASE_URLS.USER_SERVICE}/users/refresh-token`,
          { refresh_token: refreshToken },
          { timeout: API_CONFIG.TIMEOUT },
        );
        await this.saveAccessToken(data.access_token);
        if (data.refresh_token) await this.saveRefreshToken(data.refresh_token);
        return data.access_token as string;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) return null; // server said no
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      if (!token) return false;
      return !this.isTokenExpired(token);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}
