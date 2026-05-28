# Architecture Decision Record
_Capture Control Migration — decided 2026-05-27_

---

## 1. Framework Decision: React 18 + TypeScript

**React wins over Angular for this project.**

Rationale grounded in the actual source code, not general preference:

- **ngUpgrade is not viable here.** ngUpgrade lets you run AngularJS and Angular side-by-side incrementally — but it requires an existing build pipeline (Webpack/Vite) and module system. This app has neither: 51 CDN `<script>` tags, no package.json, no module bundler. Wiring ngUpgrade into this would take longer than a clean rewrite and produce a messy hybrid. Since it's a rewrite either way, Angular's incremental migration advantage disappears.
- **Angular's DI provided no discipline benefit here.** The clearest evidence: `configService` is injected twice in `order.controller.js` — a bug Angular's DI doesn't prevent. The app has 16 modules and no shared injection tokens.
- **TanStack Query eliminates the entire `authService.getConfig().then(...)` pattern** that repeats across all 26 order service methods and every module. One Axios interceptor replaces all of it.
- **React Hook Form** covers all form complexity in this app with less ceremony than Angular Reactive Forms.
- **Hiring pool.** This is an internal ERP that will outlive the current team. React's broader adoption matters for future maintainability.

---

## 2. Build System: Vite 5

- Fast HMR, ES module-native, minimal config
- Scaffold files already created: `package.json`, `vite.config.ts`, `tsconfig.json`
- Add to `package.json` after this decision: `react`, `react-dom`, `@vitejs/plugin-react`
- Update `vite.config.ts`: uncomment the React plugin line

**Bundle targets:**
- Code-split per route — each module loads only when navigated to
- Initial load: ≤ 3 JS chunks (vendor libs, app shell, first route)
- Bundle size budget: warn if any initial chunk exceeds **250KB gzipped**
- Asset filenames are hashed for cache busting

---

## 3. Folder Structure

```
src/
  auth/
    AuthGuard.tsx           ← replaces userController wrapper on all 96 templates
    authService.ts          ← token storage, refresh logic
    axiosInstance.ts        ← single Axios instance with interceptors
  modules/
    order/
      components/
        OrderList.tsx
        OrderDetail.tsx
        NewOrder.tsx
      hooks/
        useOrders.ts        ← TanStack Query hooks
      services/
        orderService.ts     ← API calls only, no auth logic
      types.ts              ← Order, OrderItem, etc.
      index.ts              ← re-exports
    products/
    purchase/
    warehouse/
    crm/
    invoice/
    rma/
    service/
    reporting/
    admin/
    edgehub/
    templates/
  shared/
    components/
      Pagination.tsx
      LoadingSpinner.tsx
      ErrorMessage.tsx
      Toast.tsx
      DataGrid.tsx          ← AG Grid wrapper
    hooks/
      useBarcodeScanner.ts  ← replaces barcodeScanner directive
      useDebounce.ts
    utils/
      currency.ts           ← replaces supercurrency filter
      phone.ts              ← replaces tel filter
      orderItems.ts         ← replaces calculateTotalOrderItems
    types.ts                ← shared types (Address, etc.)
  router.tsx                ← all 149 routes, React Router v6
  App.tsx
  main.tsx
```

---

## 4. Auth Architecture

### CRITICAL: OAuth Client Secret

The hardcoded secret in `auth.service.js:6` (`!!ghftyx2t9`) **must be removed before any other migration work.**

**Required backend change:** Add a server-side proxy route (e.g., `POST /api/auth/token`) that accepts `{ refresh_token, grant_type }` from the frontend, appends the client secret server-side, calls the real OAuth endpoint, and returns only the token response. The frontend never sees the client secret.

### Token Storage

Do NOT use `localStorage` for tokens (current approach — vulnerable to XSS).

**Use:** in-memory storage for the access token + httpOnly cookie for the refresh token (set by the backend proxy). The access token lives only in the Axios instance's memory; a page refresh triggers a silent re-auth via the httpOnly refresh token cookie.

### Axios Interceptor (replaces `authService.getConfig()` in every service method)

```ts
// src/auth/axiosInstance.ts
axiosInstance.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

axiosInstance.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    await refreshAccessToken(); // hits /api/auth/token, only one concurrent call
    return axiosInstance(error.config);
  }
  return Promise.reject(error);
});
```

### Route Guard (replaces `ng-controller="userController" ng-init="init()"` on all 96 templates)

```tsx
// src/auth/AuthGuard.tsx
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

All authenticated routes wrap with `<AuthGuard>` at the router level — no per-page auth logic.

### Role-Based Access

`hasRole(['ADMIN'])` checks are UI-only (show/hide elements). They are **not security controls** — the API enforces authorization server-side. Client-side:

```ts
const { hasRole } = useAuth();
{hasRole('ADMIN') && <ProfitLossCard />}
```

---

## 5. HTTP Layer

- Single Axios instance exported from `src/auth/axiosInstance.ts`
- All service files import this instance — no raw `fetch`, no `axios.get` directly
- All API calls remain at `/capture/...` (same origin, no URL changes)
- TanStack Query wraps all service calls — handles caching, loading states, error states automatically

```ts
// src/modules/order/services/orderService.ts
export const orderService = {
  search: (data: OrderSearchRequest) =>
    axiosInstance.post<OrderSearchResult>('/capture/order/search', data),
  findById: (id: string) =>
    axiosInstance.get<Order>(`/capture/order/${id}`),
};
```

---

## 6. State Management

| State type | Tool | Reason |
|---|---|---|
| Server data (orders, products, etc.) | TanStack Query | Handles fetch, cache, refetch, loading/error |
| Auth state (current user, token) | Zustand store | Small, shared, no boilerplate |
| UI state (modals, selected items) | `useState` local | No need to share |
| Reference data (countries, config) | TanStack Query with `staleTime: Infinity` | Replaces the global `data.js` variable |

No Redux. The app has no cross-module shared mutable state that would justify it.

---

## 7. Input Validation

- **React Hook Form** for all forms
- Zod schemas for validation — define once, reuse in both form validation and TypeScript types
- Email validation regex from the existing `validateEmails()` function is correct — port it to a Zod schema
- Rich text (Quill output) rendered via a sanitization wrapper — use `DOMPurify` before any `dangerouslySetInnerHTML`

---

## 8. Dependency Management Rules

- `package-lock.json` must be committed — no exceptions
- No `*` or `^` version ranges for security-critical packages (axios, auth libraries)
- Run `npm audit` as part of CI — fail build on high/critical vulnerabilities
- All CDN dependencies replaced with npm packages — CDN loading bypasses integrity controls and `npm audit`
- `.env` files never committed (already in `.gitignore`)

---

## 9. UI Component Library: shadcn/ui + Tailwind CSS

Replaces Bootstrap 5 + jQuery runtime.

- shadcn/ui components are copied into the repo (not a black-box dependency) — fully customizable
- Tailwind replaces Bootstrap utility classes — similar mental model, no jQuery required
- Bootstrap's grid system → Tailwind's flex/grid utilities
- jQuery modal/toast calls in controllers → shadcn Dialog, Toast, Sheet components

---

## 10. Data Grid: AG Grid Community

Replaces unmaintained ui-grid.

- Free community tier is sufficient for this app's data volumes
- React wrapper: `ag-grid-react`
- Handles large datasets, sorting, filtering, pagination all built-in
- Column definitions are typed — fits the TypeScript-first approach

---

## 11. Charts: Chart.js only

Drop Google Charts. Keep Chart.js.

- React wrapper: `react-chartjs-2`
- Google Charts requires loading from `gstatic.com` CDN — external dependency, no npm package, no offline support
- Chart.js covers all chart types currently used (bar, line, area)

---

## 12. Known Issues — Remediation Map

| # | Issue | Fix |
|---|---|---|
| 1 | OAuth client secret in frontend | Backend proxy for token endpoint — **do before any other work** |
| 2 | Duplicate `/packing` route | Deduplicated in React Router config |
| 3 | Duplicate `configService` injection | Fixed in AngularJS source (already done); won't exist in React |
| 4 | No build system | Vite — already scaffolded |
| 5 | jQuery DOM manipulation in controllers | React manages DOM — jQuery removed entirely |
| 6 | `userController` wrapper on 96 templates | `<AuthGuard>` at router level — one place |
| 7 | No loading states | TanStack Query provides `isLoading` on every query; `<LoadingSpinner>` in shared components |
| 8 | Search debounce missing | `useDebounce(value, 300)` hook in shared — apply to all search inputs |
| 9 | No user-facing error states | TanStack Query provides `isError` / `error`; `<ErrorMessage>` in shared components |
| 10 | `console.log` in production | ESLint `no-console: error` rule — already in `.eslintrc.json` |

---

## Migration Gate

**Before Phase 2 begins**, the Architect must review and approve the Phase 1 output:
- Auth module implementation (interceptor, guard, token storage)
- Folder structure matches this document
- No raw `fetch` or direct `axios` calls — all through `axiosInstance`
- Zero `any` types in auth and shared modules
- ESLint passes with zero errors
