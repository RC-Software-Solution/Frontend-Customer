/**
 * Authentication Service
 * Handles user authentication, token management, and user state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserApiClient } from '../clients/user-api.client';
import { TokenUtils } from '../utils/token.utils';
import { ErrorUtils } from '../utils/error.utils';
import { 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse, 
  User,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '../types/api.types';
import { API_CONFIG } from '../config/api.config';

export class AuthenticationService {
  private userApiClient: UserApiClient;
  private currentUser: User | null = null;

  constructor() {
    this.userApiClient = new UserApiClient();
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.userApiClient.login(credentials);
      
      // Save tokens and user data
      await this.saveUserSession(response);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Signup user
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      const response = await this.userApiClient.signup(userData);
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Revoke the refresh token on the server (an expired access token is renewed by the API client)
      if (await TokenUtils.getRefreshToken()) {
        await this.userApiClient.logout();
      }
    } catch (error) {
      console.warn('Server logout failed, clearing local session anyway');
    } finally {
      await this.clearUserSession();
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await TokenUtils.isAuthenticated();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Return cached user if available
      if (this.currentUser) {
        return this.currentUser;
      }

      // Check if user is authenticated
      if (!(await this.isAuthenticated())) {
        return null;
      }

      // Fetch user from storage
      const userData = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }

      // If not in storage, fetch from API
      const user = await this.userApiClient.getProfile();
      this.currentUser = user;
      await this.saveUserData(user);
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (await TokenUtils.refresh()) return true;
      // Server rejected the refresh token (expired/revoked): the session is over
      await this.clearUserSession();
      return false;
    } catch (error) {
      // Network error: keep the stored session, we just couldn't reach the server
      console.warn('Token refresh failed (network?)');
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.userApiClient.updateProfile(userData);
      this.currentUser = updatedUser;
      await this.saveUserData(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await this.userApiClient.changePassword(currentPassword, newPassword);
      // the server signs every other device out and hands this one fresh tokens
      if (response.access_token && response.refresh_token) {
        await TokenUtils.saveTokens(response.access_token, response.refresh_token);
      }
    } catch (error) {
      console.error('Password change failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await this.userApiClient.forgotPassword({ email });
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await this.userApiClient.resetPassword({ email, code, new_password: newPassword });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Not signed in');
      await this.userApiClient.deleteAccount(user.id);
      await this.clearUserSession();
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Save user session (tokens + user data)
   */
  private async saveUserSession(loginResponse: LoginResponse): Promise<void> {
    try {
      await Promise.all([
        TokenUtils.saveTokens(loginResponse.access_token, loginResponse.refresh_token),
        this.saveUserData(loginResponse.user),
      ]);
      
      this.currentUser = loginResponse.user;
    } catch (error) {
      console.error('Error saving user session:', error);
      throw error;
    }
  }

  /**
   * Save user data to storage
   */
  private async saveUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Clear user session (tokens + user data)
   */
  private async clearUserSession(): Promise<void> {
    try {
      await Promise.all([
        TokenUtils.clearTokens(),
        AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA),
      ]);
      
      this.currentUser = null;
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return await TokenUtils.getAccessToken();
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await TokenUtils.getRefreshToken();
  }
}

