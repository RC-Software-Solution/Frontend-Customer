/**
 * Base API Client
 * Provides common functionality for all service-specific API clients
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ServiceName } from '../config/api.config';
import { TokenUtils } from '../utils/token.utils';
import { ErrorUtils } from '../utils/error.utils';
import { ApiResponse, ApiError } from '../types/api.types';

export class BaseApiClient {
  protected client: AxiosInstance;
  protected serviceName: ServiceName;

  constructor(serviceName: ServiceName, customConfig?: AxiosRequestConfig) {
    this.serviceName = serviceName;
    this.client = this.createClient(customConfig);
    this.setupInterceptors();
  }

  /**
   * Create axios instance with base configuration
   */
  private createClient(customConfig?: AxiosRequestConfig): AxiosInstance {
    const baseURL = API_CONFIG.BASE_URLS[this.serviceName];
    
    return axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
      ...customConfig,
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor for authentication
   */
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication token if available
          const token = await TokenUtils.getAccessToken();
          if (token && !TokenUtils.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
            
          } else if (token) {
            // Token is expired, remove it
            console.log(`⏰ [${this.serviceName}] Token expired, removing from storage`);
            await TokenUtils.removeAccessToken();
          }
        } catch (error) {
          console.error(`❌ [${this.serviceName}] Error in request interceptor:`, error);
        }
        
        
        
        return config;
      },
      (error) => {
        console.error(`❌ [${this.serviceName}] Request interceptor error:`, error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor for error handling
   */
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        
        return response;
      },
      async (error: AxiosError) => {
        const apiError = ErrorUtils.createApiError(error);
        
        

        // Handle specific error cases
        if (ErrorUtils.isAuthError(error)) {
          console.log(`🔐 [${this.serviceName}] Authentication error, clearing tokens`);
          await TokenUtils.clearTokens();
          // You might want to redirect to login here
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Make a GET request
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a POST request
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a PUT request
   */
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Format response to standard API response format
   */
  private formatResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      success: true,
      data: response.data,
      message: response.data?.message,
    };
  }

  /**
   * Get the underlying axios instance (for advanced usage)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

