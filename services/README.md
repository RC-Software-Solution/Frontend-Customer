# Services Architecture

This directory contains a clean, scalable service architecture for connecting to backend services in the React Native frontend.

## Structure

```
services/
├── config/
│   └── api.config.ts          # API configuration and constants
├── types/
│   └── api.types.ts           # TypeScript types and interfaces
├── utils/
│   ├── token.utils.ts         # JWT token management utilities
│   └── error.utils.ts         # Error handling utilities
├── clients/
│   ├── base-api.client.ts     # Base API client with interceptors
│   ├── user-api.client.ts     # User service API client
│   └── order-api.client.ts    # Order service API client
├── auth/
│   └── authentication.service.ts  # Authentication service
├── order/
│   └── order.service.ts       # Order service
├── index.ts                   # Main exports
└── README.md                  # This file
```

## Features

### 🔧 Configuration Management
- Centralized API configuration
- Environment-specific settings
- Service-specific base URLs
- Configurable timeouts and retry logic

### 🔐 Authentication
- JWT token management
- Automatic token refresh
- Secure token storage
- Session management

### 🛡️ Error Handling
- Standardized error responses
- Network error detection
- User-friendly error messages
- Automatic error logging

### 📡 API Clients
- Service-specific API clients
- Request/response interceptors
- Automatic authentication
- Error handling

### 🔄 Services
- Business logic separation
- Data validation
- Caching strategies
- State management

## Usage

### Basic Usage

```typescript
import { authService, orderService } from '@/services';

// Authentication
const loginResponse = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Orders
const orders = await orderService.getUserOrders();
const newOrder = await orderService.createOrder(orderData);
```

### Advanced Usage

```typescript
import { UserApiClient, OrderApiClient } from '@/services';

// Direct API client usage
const userApi = new UserApiClient();
const orderApi = new OrderApiClient();

// Custom error handling
try {
  const user = await userApi.getProfile();
} catch (error) {
  console.error('Error:', error.message);
}
```

## Adding New Services

### 1. Create API Client

```typescript
// services/clients/your-service-api.client.ts
import { BaseApiClient } from './base-api.client';

export class YourServiceApiClient extends BaseApiClient {
  constructor() {
    super('YOUR_SERVICE');
  }

  async yourMethod(): Promise<YourResponse> {
    const response = await this.get<YourResponse>('/your-endpoint');
    return response.data;
  }
}
```

### 2. Create Service

```typescript
// services/your-service/your-service.ts
import { YourServiceApiClient } from '../clients/your-service-api.client';

export class YourService {
  private apiClient: YourServiceApiClient;

  constructor() {
    this.apiClient = new YourServiceApiClient();
  }

  async yourBusinessLogic(): Promise<YourResponse> {
    // Add business logic here
    return await this.apiClient.yourMethod();
  }
}
```

### 3. Update Configuration

```typescript
// services/config/api.config.ts
export const API_CONFIG = {
  BASE_URLS: {
    // ... existing services
    YOUR_SERVICE: 'http://your-service-url/api',
  },
  // ... rest of config
};
```

### 4. Export Service

```typescript
// services/index.ts
export { YourService } from './your-service/your-service';
export const yourService = new YourService();
```

## Best Practices

### ✅ Do
- Use the service layer for business logic
- Validate data before API calls
- Handle errors gracefully
- Use TypeScript types
- Log important operations
- Cache data when appropriate

### ❌ Don't
- Make direct API calls from components
- Handle authentication in components
- Ignore error handling
- Use `any` types
- Store sensitive data in plain text
- Mix business logic with UI logic

## Migration from Legacy Code

### Before (Legacy)
```typescript
import api from '@/services/api';

const response = await api.post('/users/login', {
  email: 'user@example.com',
  password: 'password123'
});
```

### After (New Architecture)
```typescript
import { authService } from '@/services';

const response = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});
```

## Error Handling

The new architecture provides comprehensive error handling:

```typescript
try {
  const result = await authService.login(credentials);
} catch (error) {
  // Error is automatically formatted
  console.error('Login failed:', error.message);
  
  // Check error type
  if (ErrorUtils.isNetworkError(error)) {
    // Handle network error
  } else if (ErrorUtils.isAuthError(error)) {
    // Handle authentication error
  }
}
```

## Token Management

Tokens are automatically managed:

```typescript
// Check authentication status
const isAuthenticated = await authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();

// Logout (clears all tokens)
await authService.logout();
```

## Testing

Services can be easily mocked for testing:

```typescript
// Mock the service
jest.mock('@/services', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
  },
}));
```

## Contributing

When adding new services or modifying existing ones:

1. Follow the established patterns
2. Add proper TypeScript types
3. Include error handling
4. Add JSDoc comments
5. Update this README
6. Test thoroughly











