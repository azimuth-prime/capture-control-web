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

// Products
const ProductList       = lazy(() => import('./modules/products/components/ProductList').then((m) => ({ default: m.ProductList })))
const ProductDetail     = lazy(() => import('./modules/products/components/ProductDetail').then((m) => ({ default: m.ProductDetail })))
const SkuDetail         = lazy(() => import('./modules/products/components/SkuDetail').then((m) => ({ default: m.SkuDetail })))
const SkuBundleDetail   = lazy(() => import('./modules/products/components/SkuBundleDetail').then((m) => ({ default: m.SkuBundleDetail })))
const InventoryDetail   = lazy(() => import('./modules/products/components/InventoryDetail').then((m) => ({ default: m.InventoryDetail })))
const ProductImport     = lazy(() => import('./modules/products/components/ProductImport').then((m) => ({ default: m.ProductImport })))

// CRM
const OrganizationList   = lazy(() => import('./modules/crm/components/OrganizationList').then((m) => ({ default: m.OrganizationList })))
const OrganizationDetail = lazy(() => import('./modules/crm/components/OrganizationDetail').then((m) => ({ default: m.OrganizationDetail })))
const UserList           = lazy(() => import('./modules/crm/components/UserList').then((m) => ({ default: m.UserList })))
const UserDetail         = lazy(() => import('./modules/crm/components/UserDetail').then((m) => ({ default: m.UserDetail })))
const MyAccount          = lazy(() => import('./modules/crm/components/MyAccount').then((m) => ({ default: m.MyAccount })))

// Invoice
const InvoiceList   = lazy(() => import('./modules/invoice/components/InvoiceList').then((m) => ({ default: m.InvoiceList })))
const InvoiceDetail = lazy(() => import('./modules/invoice/components/InvoiceDetail').then((m) => ({ default: m.InvoiceDetail })))

// RMA
const RmaList   = lazy(() => import('./modules/rma/components/RmaList').then((m) => ({ default: m.RmaList })))
const RmaDetail = lazy(() => import('./modules/rma/components/RmaDetail').then((m) => ({ default: m.RmaDetail })))

// Service Orders
const ServiceOrderList   = lazy(() => import('./modules/service/components/ServiceOrderList').then((m) => ({ default: m.ServiceOrderList })))
const ServiceOrderDetail = lazy(() => import('./modules/service/components/ServiceOrderDetail').then((m) => ({ default: m.ServiceOrderDetail })))

// Edge Hubs
const EdgeHubList   = lazy(() => import('./modules/edgehub/components/EdgeHubList').then((m) => ({ default: m.EdgeHubList })))
const EdgeHubDetail = lazy(() => import('./modules/edgehub/components/EdgeHubDetail').then((m) => ({ default: m.EdgeHubDetail })))

// Warehouse
const Picking      = lazy(() => import('./modules/warehouse/components/Picking').then((m) => ({ default: m.Picking })))
const PickDetail   = lazy(() => import('./modules/warehouse/components/PickDetail').then((m) => ({ default: m.PickDetail })))
const Packing      = lazy(() => import('./modules/warehouse/components/Packing').then((m) => ({ default: m.Packing })))
const PackDetail   = lazy(() => import('./modules/warehouse/components/PackDetail').then((m) => ({ default: m.PackDetail })))
const Shipping     = lazy(() => import('./modules/warehouse/components/Shipping').then((m) => ({ default: m.Shipping })))
const ShipDetail   = lazy(() => import('./modules/warehouse/components/ShipDetail').then((m) => ({ default: m.ShipDetail })))
const TransferList = lazy(() => import('./modules/warehouse/components/TransferList').then((m) => ({ default: m.TransferList })))
const TransferDetail = lazy(() => import('./modules/warehouse/components/TransferDetail').then((m) => ({ default: m.TransferDetail })))

// Purchase Orders
const PurchaseList         = lazy(() => import('./modules/purchase/components/PurchaseList').then((m) => ({ default: m.PurchaseList })))
const PurchaseDetail       = lazy(() => import('./modules/purchase/components/PurchaseDetail').then((m) => ({ default: m.PurchaseDetail })))
const PurchaseByState      = lazy(() => import('./modules/purchase/components/PurchaseByState').then((m) => ({ default: m.PurchaseByState })))
const NewPurchaseOrder     = lazy(() => import('./modules/purchase/components/NewPurchaseOrder').then((m) => ({ default: m.NewPurchaseOrder })))
const PurchaseReorder      = lazy(() => import('./modules/purchase/components/PurchaseReorder').then((m) => ({ default: m.PurchaseReorder })))
const VendorPriceLists     = lazy(() => import('./modules/purchase/components/VendorPriceLists').then((m) => ({ default: m.VendorPriceLists })))
const VendorPriceListDetail = lazy(() => import('./modules/purchase/components/VendorPriceListDetail').then((m) => ({ default: m.VendorPriceListDetail })))

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
  { path: '/products',                       element: guard(<ProductList />) },
  { path: '/products/:id',                   element: guard(<ProductDetail />) },
  { path: '/products/skus/:id',              element: guard(<SkuDetail />) },
  { path: '/products/skus/inventory/:id',    element: guard(<InventoryDetail />) },
  { path: '/products/skus/bundles/:id',      element: guard(<SkuBundleDetail />) },
  { path: '/app/products/settings',          element: ph('Product Settings') },
  { path: '/import',                         element: guard(<ProductImport />) },

  // --- Purchase Orders ---
  { path: '/purchase',                 element: guard(<PurchaseList />) },
  { path: '/purchase/:id',             element: guard(<PurchaseDetail />) },
  { path: '/purchase/state/:state',    element: guard(<PurchaseByState />) },
  { path: '/new-purchase-order',       element: guard(<NewPurchaseOrder />) },
  { path: '/purchase-reorder/:id',     element: guard(<PurchaseReorder />) },
  { path: '/vendor-price-lists',       element: guard(<VendorPriceLists />) },
  { path: '/vendor-price-list/:id',    element: guard(<VendorPriceListDetail />) },
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
  { path: '/packing',           element: guard(<Packing />) },
  { path: '/pack-details/:id',  element: guard(<PackDetail />) },
  { path: '/picking',           element: guard(<Picking />) },
  { path: '/pick-details/:id',  element: guard(<PickDetail />) },
  { path: '/shipping',          element: guard(<Shipping />) },
  { path: '/ship-details/:id',  element: guard(<ShipDetail />) },
  { path: '/transfer',          element: guard(<TransferList />) },
  { path: '/transfer/:id',      element: guard(<TransferDetail />) },
  { path: '/app/warehouse/settings', element: ph('Warehouse Settings') },

  // --- RMA ---
  { path: '/rma',     element: guard(<RmaList />) },
  { path: '/rma/:id', element: guard(<RmaDetail />) },

  // --- Service Orders ---
  { path: '/serviceorder',       element: guard(<ServiceOrderList />) },
  { path: '/serviceorder/:id',   element: guard(<ServiceOrderDetail />) },
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
  { path: '/edgehubs',              element: guard(<EdgeHubList />) },
  { path: '/edgehubs/:id',          element: guard(<EdgeHubDetail />) },
  { path: '/app/edgehubs/settings', element: ph('Edge Hub Settings') },

  // --- Auth ---
  { path: '/login', element: <Login /> },
  { path: '*',      element: <Navigate to="/" replace /> },
])
