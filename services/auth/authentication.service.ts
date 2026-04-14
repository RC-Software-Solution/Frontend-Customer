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
      // Call logout API if user is authenticated
      if (await this.isAuthenticated()) {
        await this.userApiClient.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local session regardless of API call result
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
      const refreshToken = await TokenUtils.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await this.userApiClient.refreshToken({ refresh_token: refreshToken });
      
      // Save new tokens
      await TokenUtils.saveTokens(response.access_token, response.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear session if refresh fails
      await this.clearUserSession();
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
      await this.userApiClient.changePassword(currentPassword, newPassword);
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
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.userApiClient.resetPassword({ token, new_password: newPassword });
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
      await this.userApiClient.deleteAccount();
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

