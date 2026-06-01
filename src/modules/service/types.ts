import type { PagedResult } from '../../shared/types'
import type { Address } from '../../shared/types'

export type ServiceOrderState =
  | 'DRAFT'
  | 'ISSUED'
  | 'RECEIVED'
  | 'COMPLETE'
  | 'CANCELLED'

export interface ServiceOrderWarehouse {
  id: string
  name: string
}

export interface ServiceOrderSupplier {
  id: string
  name: string
}

export interface ServiceOrderCarrier {
  id: string
  name: string
}

export interface ServiceOrderPriceInfo {
  total: number
  paymentTerm?: string
}

export interface ServiceOrderInvoicePriceInfo {
  total: number
}

export interface ServiceOrderInvoice {
  id: string
  creationDate: string
  priceInfo: ServiceOrderInvoicePriceInfo
}

export interface ServiceOrderItem {
  id: string
  inventoryId: string
  productId?: string
  productName: string
  lotSerial?: string
  quantity: number
  unitPrice: number
  tax: string
  instructions?: string
}

export interface ServiceOrderInvoicableItem {
  id: string
  productName: string
  lotSerial?: string
  quantity: number
  unitPrice: number
}

export interface ServiceOrder {
  id: string
  state: ServiceOrderState
  supplier: ServiceOrderSupplier
  supplierAddress?: Address
  warehouse: ServiceOrderWarehouse
  carrier?: ServiceOrderCarrier
  items: ServiceOrderItem[]
  invoices: ServiceOrderInvoice[]
  priceInfo: ServiceOrderPriceInfo
  notes?: string
  requestedByDate: string | null
  issuedDate: string | null
  receivedDate: string | null
  creationDate: string
  lastModifiedDate: string
}

export interface ServiceOrderSummary {
  id: string
  supplierName: string
  state: ServiceOrderState
  creationDate: string
}

export interface ServiceOrderSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  sortBy?: string
  sortDirection?: '+' | '-'
}

export interface ServiceOrderStateChangeRequest {
  id: string
  state: ServiceOrderState
}

export interface ServiceOrderCarrierRequest {
  id: string
  carrierId: string
}

export interface ServiceOrderSaveItemsRequest {
  serviceOrderId: string
  items: {
    id: string
    inventoryId: string
    quantity: number
    unitPrice: number
    tax: string
    instructions?: string
  }[]
}

export interface ServiceOrderPrintRequest {
  id: string
  qty: number
}

export interface ServiceOrderAddInvoiceRequest {
  serviceOrderId: string
  items: { id: string; quantity: number }[]
}

export type ServiceOrderPagedResult = PagedResult<ServiceOrderSummary>
