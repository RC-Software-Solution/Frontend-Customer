/**
 * User API Client
 * Handles all user-related API calls
 */

import { BaseApiClient } from './base-api.client';
import { 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse, 
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordResponse,
  NoticesResponse
} from '../types/api.types';

export class UserApiClient extends BaseApiClient {
  constructor() {
    super('USER_SERVICE');
  }

  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/users/login', credentials);
    return response.data;
  }

  /**
   * User signup
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    const response = await this.post<SignupResponse>('/users/signup', userData);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.get<User>('/users/profile');
    return response.data;
  }

  /**
   * Announcements for this customer (global + their area), newest first
   */
  async getNotices(limit = 50): Promise<NoticesResponse> {
    const response = await this.get<NoticesResponse>(`/users/notices?limit=${limit}`);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.put<User>('/users/profile', userData);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const response = await this.post<ChangePasswordResponse>('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    // client: 'mobile' asks the server for a 6-digit code instead of the web link
    const response = await this.post<{ message: string }>('/users/forgot-password', { ...data, client: 'mobile' });
    return response.data;
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/reset-password', {
      email: data.email,
      code: data.code,
      newPassword: data.new_password, // the server's field name
    });
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.post<RefreshTokenResponse>('/users/refresh-token', data);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/logout');
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string | number): Promise<{ message: string }> {
    const response = await this.put<{ message: string }>(`/users/delete/${userId}`);
    return response.data;
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/verify-email', { token });
    return response.data;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>('/users/resend-verification');
    return response.data;
  }
}

