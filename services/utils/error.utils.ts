/**
 * Error Utilities
 * Helper functions for error handling and formatting
 */

import { ApiError } from '../types/api.types';

export class ErrorUtils {
  /**
   * Create a standardized API error object
   */
  static createApiError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.response.data?.error || 'Server error occurred',
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR',
        details: error.request,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
        code: 'UNKNOWN_ERROR',
        details: error,
      };
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: any): string {
    const apiError = this.createApiError(error);
    
    // Map common error codes to user-friendly messages
    switch (apiError.code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again';
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action';
      case 'NOT_FOUND':
        return 'The requested resource was not found';
      case 'VALIDATION_ERROR':
        return apiError.message;
      case 'SERVER_ERROR':
        return 'Server error occurred. Please try again later';
      default:
        return apiError.message;
    }
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  /**
   * Check if error is a server error (5xx)
   */
  static isServerError(error: any): boolean {
    return error.response && error.response.status >= 500;
  }

  /**
   * Check if error is a client error (4xx)
   */
  static isClientError(error: any): boolean {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: any): boolean {
    return error.response && error.response.status === 401;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: any): boolean {
    return error.response && error.response.status === 422;
  }
}

