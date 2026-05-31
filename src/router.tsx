import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthGuard } from './auth/AuthGuard'
import { LoadingSpinner } from './shared/components/LoadingSpinner'
import Placeholder from './modules/Placeholder'
import Login from './modules/auth/Login'

// Admin
const AdminConfig = lazy(() => import('./modules/admin/components/AdminConfig').then((m) => ({ default: m.AdminConfig })))
const AppConfig   = lazy(() => import('./modules/admin/components/AppConfig').then((m) => ({ default: m.AppConfig })))
const AppSearch   = lazy(() => import('./modules/admin/components/AppSearch').then((m) => ({ default: m.AppSearch })))

// CRM
const OrganizationList   = lazy(() => import('./modules/crm/components/OrganizationList').then((m) => ({ default: m.OrganizationList })))
const OrganizationDetail = lazy(() => import('./modules/crm/components/OrganizationDetail').then((m) => ({ default: m.OrganizationDetail })))
const UserList           = lazy(() => import('./modules/crm/components/UserList').then((m) => ({ default: m.UserList })))
const UserDetail         = lazy(() => import('./modules/crm/components/UserDetail').then((m) => ({ default: m.UserDetail })))
const MyAccount          = lazy(() => import('./modules/crm/components/MyAccount').then((m) => ({ default: m.MyAccount })))

// Invoice
const InvoiceList   = lazy(() => import('./modules/invoice/components/InvoiceList').then((m) => ({ default: m.InvoiceList })))
const InvoiceDetail = lazy(() => import('./modules/invoice/components/InvoiceDetail').then((m) => ({ default: m.InvoiceDetail })))

// Order
const OrderList   = lazy(() => import('./modules/order/components/OrderList').then((m) => ({ default: m.OrderList })))
const OrderDetail = lazy(() => import('./modules/order/components/OrderDetail').then((m) => ({ default: m.OrderDetail })))

const guard = (element: React.ReactNode) => (
  <AuthGuard>
    <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
  </AuthGuard>
)

const ph = (name: string) => guard(<Placeholder module={name} />)

export const router = createBrowserRouter([
  // --- Dashboards ---
  { path: '/',             element: ph('Dashboard') },
  { path: '/prd-dashboard', element: ph('Products Dashboard') },
  { path: '/po-dashboard',  element: ph('Purchase Orders Dashboard') },
  { path: '/so-dashboard',  element: ph('Sales Orders Dashboard') },
  { path: '/wms-dashboard', element: ph('Warehouse Dashboard') },

  // --- Products ---
  { path: '/products',                       element: ph('Products') },
  { path: '/products/:id',                   element: ph('Product Detail') },
  { path: '/products/skus/:id',              element: ph('SKU Detail') },
  { path: '/products/skus/inventory/:id',    element: ph('Inventory Detail') },
  { path: '/products/skus/bundles/:id',      element: ph('SKU Bundle Detail') },
  { path: '/app/products/settings',          element: ph('Product Settings') },
  { path: '/import',                         element: ph('Inventory Import') },

  // --- Purchase Orders ---
  { path: '/purchase',                 element: ph('Purchase Orders') },
  { path: '/purchase/:id',             element: ph('Purchase Order Detail') },
  { path: '/purchase/state/:state',    element: ph('Purchase Orders by State') },
  { path: '/new-purchase-order',       element: ph('New Purchase Order') },
  { path: '/purchase-reorder/:id',     element: ph('Re-Order') },
  { path: '/vendor-price-lists',       element: ph('Vendor Price Lists') },
  { path: '/vendor-price-list/:id',    element: ph('Vendor Price List Detail') },
  { path: '/app/purchase/settings',    element: ph('Purchase Settings') },

  // --- Sales Orders ---
  { path: '/order',              element: guard(<OrderList />) },
  { path: '/order/:id',          element: guard(<OrderDetail />) },
  { path: '/new-order',          element: ph('New Sales Order') },
  { path: '/app/order/settings', element: ph('Order Settings') },

  // --- Invoice ---
  { path: '/invoice',     element: guard(<InvoiceList />) },
  { path: '/invoice/:id', element: guard(<InvoiceDetail />) },

  // --- CRM ---
  { path: '/crm',                          element: guard(<OrganizationList />) },
  { path: '/crm/:id',                      element: guard(<OrganizationDetail />) },
  { path: '/access-management/users',      element: guard(<UserList />) },
  { path: '/access-management/user/:id',   element: guard(<UserDetail />) },
  { path: '/access-management/myaccount',  element: guard(<MyAccount />) },

  // --- Warehouse ---
  { path: '/packing',           element: ph('Packing') },
  { path: '/pack-details/:id',  element: ph('Pack Detail') },
  { path: '/picking',           element: ph('Picking') },
  { path: '/pick-details/:id',  element: ph('Pick Detail') },
  { path: '/shipping',          element: ph('Shipping') },
  { path: '/ship-details/:id',  element: ph('Ship Detail') },
  { path: '/transfer',          element: ph('Transfers') },
  { path: '/transfer/:id',      element: ph('Transfer Detail') },
  { path: '/app/warehouse/settings', element: ph('Warehouse Settings') },

  // --- RMA ---
  { path: '/rma',     element: ph('RMAs') },
  { path: '/rma/:id', element: ph('RMA Detail') },

  // --- Service Orders ---
  { path: '/serviceorder',       element: ph('Service Orders') },
  { path: '/serviceorder/:id',   element: ph('Service Order Detail') },
  { path: '/new-serviceorder',   element: ph('New Service Order') },

  // --- Reporting ---
  { path: '/reporting',                                element: ph('Reporting') },
  { path: '/reporting/inventory-count-location',       element: ph('Inventory Count by Location') },
  { path: '/reporting/product-availability',           element: ph('Product Availability') },
  { path: '/reporting/inventory-availability',         element: ph('Inventory Availability') },
  { path: '/reporting/sales-orders-by-dates',          element: ph('Sales Orders by Date') },
  { path: '/reporting/inventory-adjustments',          element: ph('Inventory Adjustments') },
  { path: '/reporting/inventory-receipts',             element: ph('Inventory Receipts') },
  { path: '/reporting/inventory-spot-count',           element: ph('Inventory Spot Count') },
  { path: '/reporting/inventory-audit',                element: ph('Inventory Audit') },
  { path: '/reporting/inventory-audit-new',            element: ph('New Inventory Audit') },
  { path: '/reporting/inventory-audit/:id',            element: ph('Inventory Audit Detail') },
  { path: '/reporting/inventory-transfers',            element: ph('Inventory Transfers') },
  { path: '/reporting/cancelled-sales-orders',         element: ph('Cancelled Sales Orders') },
  { path: '/reporting/backordered-sales-orders',       element: ph('Backordered Sales Orders') },
  { path: '/reporting/overdue-sales-orders',           element: ph('Overdue Sales Orders') },
  { path: '/reporting/sales-orders-by-salesperson',    element: ph('Sales by Salesperson') },
  { path: '/reporting/sales-orders-by-customer',       element: ph('Sales by Customer') },

  // --- Admin ---
  { path: '/admin/settings',        element: guard(<AdminConfig />) },
  { path: '/admin/app-config',      element: guard(<AppConfig />) },
  { path: '/admin/app-integration', element: ph('Integrations') },
  { path: '/admin/app-search',      element: guard(<AppSearch />) },

  // --- Edge Hubs ---
  { path: '/edgehubs',              element: ph('Edge Hubs') },
  { path: '/edgehubs/:id',          element: ph('Edge Hub Detail') },
  { path: '/edgehubs/tags',         element: ph('Edge Hub Tags') },
  { path: '/app/edgehubs/settings', element: ph('Edge Hub Settings') },

  // --- Auth ---
  { path: '/login', element: <Login /> },
  { path: '*',      element: <Navigate to="/" replace /> },
])
