import type { PagedResult } from '../../shared/types'

// ── Shared ────────────────────────────────────────────────────────────────────

export interface DateRangeRequest {
  fromDate: string
  toDate: string
}

export interface KeywordPageRequest {
  keyword: string
  page: number
  resultsPerPage: number
  sortBy?: string
  sortDirection?: '+' | '-'
}

export interface SpotCheckRequest {
  warehouseId: string
  type: 'location' | 'product'
  quantity: number
}

// ── Inventory report rows ─────────────────────────────────────────────────────

export interface InventoryCountRow {
  id: string
  location?: string
  productId?: string
  productName?: string
  skuId?: string
  lotSerial?: string
  onHand: number
  warehouseName?: string
}

export interface ProductAvailabilityRow {
  id: string
  name: string
  onHand: number
  available: number
  creationDate?: string
  stockUnit?: string
  controlType?: string
}

export interface InventoryAvailabilityRow {
  id: string
  skuId?: string
  productId?: string
  productName?: string
  available: number
  onHand: number
  warehouseName?: string
  location?: string
}

export interface InventoryAdjustmentRow {
  id: string
  date: string
  adjustmentType: string
  quantity: number
  productName?: string
  skuId?: string
  lotSerial?: string
  warehouseName?: string
  reference?: string
}

export interface InventoryReceiptRow {
  id: string
  date: string
  productName?: string
  skuId?: string
  lotSerial?: string
  quantity: number
  warehouseName?: string
  poNumber?: string
}

export interface InventoryTransferRow {
  id: string
  date: string
  productName?: string
  skuId?: string
  lotSerial?: string
  fromWarehouse?: string
  toWarehouse?: string
  quantity: number
}

export interface SpotCountRow {
  id: string
  location?: string
  productId?: string
  productName?: string
  skuId?: string
  lotSerial?: string
  onHand: number
  warehouseName?: string
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditItem {
  id: string
  lotSerial?: string
  productName?: string
  skuId?: string
  expected: number
  counted?: number
  variance?: number
  state?: string
}

export interface AuditSummary {
  id: string
  warehouse: { id?: string; name: string }
  startDate?: string
  endDate?: string
  state: string
}

export interface Audit {
  id: string
  warehouse: { id: string; name: string }
  startDate?: string
  endDate?: string
  state: string
  items?: AuditItem[]
}

export interface SaveAuditRequest {
  warehouse: { id: string; name: string }
}

// ── Sales report rows ─────────────────────────────────────────────────────────

export interface SalesOrderSummary {
  orderId: string
  customerName?: string
  date?: string
  total: number
  lineCount?: number
  state?: string
}

export interface CancelledOrderRow {
  orderId: string
  customerName?: string
  date?: string
  total: number
}

export interface BackorderedOrderRow {
  orderId: string
  customerName?: string
  dueDate?: string
  productName?: string
  skuId?: string
  quantity: number
}

export interface OverdueOrderRow {
  orderId: string
  customerName?: string
  dueDate?: string
  total: number
}

export interface SalespersonOrder {
  orderId: string
  customerName?: string
  date?: string
  total: number
}

export interface SalespersonSummary {
  firstName?: string
  lastName?: string
  email?: string
  orderCount?: number
  total?: number
  orders?: SalespersonOrder[]
}

export interface CustomerOrder {
  orderId: string
  date?: string
  total: number
  state?: string
}

export interface CustomerSummary {
  customerName?: string
  customerId?: string
  orderCount?: number
  total?: number
  orders?: CustomerOrder[]
}

// ── Paged result aliases ───────────────────────────────────────────────────────

export type InventoryCountPagedResult = PagedResult<InventoryCountRow>
export type ProductAvailabilityPagedResult = PagedResult<ProductAvailabilityRow>
export type InventoryAvailabilityPagedResult = PagedResult<InventoryAvailabilityRow>
export type AuditPagedResult = PagedResult<AuditSummary>
