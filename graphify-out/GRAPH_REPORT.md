# Graph Report - Frontend-Customer  (2026-09-13)

## Corpus Check
- 128 files · ~313,030 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 502 nodes · 1041 edges · 22 communities (13 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.91)
- Token cost: 117,682 input · 0 output

## Community Hubs (Navigation)
- Menu Service Integration
- Auth Screens & UI Components
- Authentication Service Layer
- Overview, Profile & Order Status
- Order Service Layer
- Test & Build Tooling
- App Dependencies
- Cart & Order UI
- Expo App Configuration
- Android MainActivity
- Android MainApplication
- TypeScript Configuration
- Gradle Wrapper Script
- Global Type Declarations
- Profile Fix Summary
- Legacy Order Service

## God Nodes (most connected - your core abstractions)
1. `MenuService` - 41 edges
2. `react` - 36 edges
3. `react-native` - 29 edges
4. `MenuApiClient` - 27 edges
5. `AuthenticationService` - 25 edges
6. `BaseApiClient` - 22 edges
7. `UserApiClient` - 20 edges
8. `OrderService` - 20 edges
9. `Order` - 19 edges
10. `expo-router` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Profile Screen` --references--> `AuthenticationService`  [EXTRACTED]
  PROFILE_FIX_SUMMARY.md → services/auth/authentication.service.ts
- `Order Status Screen` --references--> `OrderService`  [EXTRACTED]
  ORDER_SERVICE_INTEGRATION.md → services/order/order.service.ts
- `Rationale: Fix Order Data Structure To Match Backend API` --rationale_for--> `CartScreen()`  [EXTRACTED]
  ORDER_SERVICE_INTEGRATION.md → screens/cart/cart.screen.tsx
- `Rationale: Replace Hardcoded Menu Data With Real-Time Backend Data` --rationale_for--> `HomeScreen()`  [EXTRACTED]
  MENU_SERVICE_INTEGRATION.md → screens/homeTab/home/home.screen.tsx
- `Order Status Screen` --references--> `useAuth()`  [EXTRACTED]
  ORDER_SERVICE_INTEGRATION.md → services/hooks/useAuth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Service Layer Architecture Pattern (BaseApiClient + business-logic services)** — services_clients_base_api_client_baseapiclient, services_menu_menu_service_menuservice, services_order_order_service_orderservice, services_auth_authentication_service_authenticationservice [INFERRED 0.85]
- **Authentication State Consumption Flow** — services_hooks_useauth_useauth, services_auth_authentication_service_authenticationservice, screens_profile_profile_screen_profilescreen, screens_hometab_home_home_screen_homescreen, screens_orderstatus_orderstatus_screen_orderstatusscreen [INFERRED 0.85]
- **Backend Microservices This App Talks To** — overview_user_service, overview_menu_service, overview_order_service [EXTRACTED 1.00]

## Communities (22 total, 3 thin omitted)

### Community 0 - "Menu Service Integration"
Cohesion: 0.06
Nodes (22): Rationale: Replace Hardcoded Menu Data With Real-Time Backend Data, HomeScreen(), MenuApiClient, MenuService, AddItemsToSessionRequest, ApiError, CreateFoodItemRequest, CreateMealSessionRequest (+14 more)

### Community 1 - "Auth Screens & UI Components"
Cohesion: 0.06
Nodes (40): ForgotPassword(), styles, styles, TabsLayout(), Button(), Styles, styles, TabBar() (+32 more)

### Community 2 - "Authentication Service Layer"
Cohesion: 0.06
Nodes (16): @react-native-async-storage/async-storage, AuthenticationService, UserApiClient, API_CONFIG, Rationale: Clean, Scalable Service Layer Architecture, BaseEntity, ForgotPasswordRequest, LoginRequest (+8 more)

### Community 3 - "Overview, Profile & Order Status"
Cohesion: 0.06
Nodes (41): Known bug: isLoggedIn state in app/_layout.tsx never set true, AWS-INFRASTRUCTURE-PLAYBOOK.md, Backend/OVERVIEW.md, CancelModal(), ModalProps, styles, GO-LIVE-PLAYBOOK.md, Menu Service Integration (+33 more)

### Community 4 - "Order Service Layer"
Cohesion: 0.09
Nodes (12): BaseApiClient, OrderApiClient, ServiceName, OrderService, Services Architecture, ApiResponse, CreateOrderRequest, GetOrdersRequest (+4 more)

### Community 5 - "Test & Build Tooling"
Cohesion: 0.05
Nodes (42): devDependencies, @babel/core, jest, jest-expo, @types/react, @types/react-native, typescript, jest (+34 more)

### Community 6 - "App Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, axios, expo, @expo/config, expo-font, @expo-google-fonts/nunito, @expo-google-fonts/raleway, expo-linear-gradient (+27 more)

### Community 7 - "Cart & Order UI"
Cohesion: 0.10
Nodes (21): Props, RenderItem(), Rationale: Fix Order Data Structure To Match Backend API, react-native-bouncy-checkbox, react-redux, @reduxjs/toolkit, CartScreen(), normalizeMealType() (+13 more)

### Community 8 - "Expo App Configuration"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, typedRoutes, expo, android, experiments (+19 more)

### Community 9 - "Android MainActivity"
Cohesion: 0.36
Nodes (5): MainActivity, DefaultReactActivityDelegate, Bundle, ReactActivity, ReactActivityDelegate

### Community 10 - "Android MainApplication"
Cohesion: 0.42
Nodes (6): MainApplication, Application, Configuration, ReactApplication, ReactHost, ReactNativeHost

### Community 11 - "TypeScript Configuration"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

### Community 12 - "Gradle Wrapper Script"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **143 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 190 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `App Dependencies` to `Test & Build Tooling`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `react` connect `Auth Screens & UI Components` to `Overview, Profile & Order Status`, `Test & Build Tooling`, `Cart & Order UI`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `axios` connect `Test & Build Tooling` to `Menu Service Integration`, `Overview, Profile & Order Status`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `MenuService` (e.g. with `OrderService` and `Rationale: Clean, Scalable Service Layer Architecture`) actually correct?**
  _`MenuService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Menu Service Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.05802469135802469 - nodes in this community are weakly interconnected._
- **Should `Auth Screens & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05578947368421053 - nodes in this community are weakly interconnected._