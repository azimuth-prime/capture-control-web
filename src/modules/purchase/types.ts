import type { PagedResult } from '../../shared/types'

export type POState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ISSUED'
  | 'RECEIVING'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'COMPLETE'

export interface Tax {
  name: string
  isoCode: string
  type: string
  amount: number
}

export interface POSupplier {
  id: string
  name: string
}

export interface POWarehouse {
  id: string
  name: string
}

export interface POCarrier {
  id: string
  name: string
}

export interface POPriceInfo {
  total: number
  paymentTerm?: string
}

export interface POItem {
  id: string
  skuId: string
  productId: string
  productName: string
  color?: string
  size?: string
  ordered: number
  approved: number
  received: number
  unitPrice: number
  tax?: string
}

export interface POInvoiceItem {
  id: string
  skuId: string
  productName: string
  ordered: number
  approved: number
  received: number
  unitPrice: number
}

export interface POInvoice {
  id: string
  state: string
  invoiceDate?: string
  total: number
  items?: POInvoiceItem[]
}

export interface PurchaseOrder {
  id: string
  state: POState
  supplier: POSupplier
  warehouse: POWarehouse
  items: POItem[]
  invoices: POInvoice[]
  priceInfo?: POPriceInfo
  requestedByDate?: string | null
  issueDate?: string | null
  receivedDate?: string | null
  specialInstructions?: string
  poNumber?: string
  carrier?: POCarrier
  creationDate?: string
  lastModifiedDate?: string
}

export interface POSummary {
  id: string
  supplierName: string
  warehouseName?: string
  state: POState
  creationDate: string
  poNumber?: string
}

export interface POReceiveItem {
  id: string
  skuId: string
  productName: string
  color?: string
  size?: string
  ordered: number
  approved: number
  received: number
  toReceive: number
}

export interface POSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  sortBy?: string
  sortDirection?: '+' | '-'
}

export interface POStateChangeRequest {
  id: string
  state: POState
}

export interface ReceiveStockRequest {
  purchaseOrderId: string
  items: { id: string; skuId: string; quantity: number }[]
}

export interface SavePOItemsRequest {
  purchaseOrderId: string
  items: POItem[]
}

export interface PriceListItem {
  id: string
  skuId: string
  productId: string
  productName: string
  vendorProductId?: string
  vendorSkuId?: string
  unitCost: number
  leadTime?: number
  stockUnit?: string
  upc?: string
}

export interface PriceList {
  supplierId: string
  supplier: { name: string }
  items: PriceListItem[]
}

export interface PriceListSummary {
  supplierId: string
  supplierName: string
  itemCount: number
  lastUpdated?: string
}

export interface SavePLItemsRequest {
  supplierId: string
  items: PriceListItem[]
}

export interface RestockItem {
  skuId: string
  productId: string
  productName: string
  color?: string
  size?: string
  unitCost?: number
  leadTime?: number
}

export type POPagedResult = PagedResult<POSummary>
export type RestockPagedResult = PagedResult<RestockItem>
