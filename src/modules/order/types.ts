import type { PagedResult } from '../../shared/types'

export type OrderStatus =
  | 'DRAFT'
  | 'QUOTE'
  | 'SUBMITTED'
  | 'BOOKED'
  | 'PROCESSING'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'PARTIAL_SHIP'
  | 'INVOICED'
  | 'CLOSED'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'BACKORDERED'
  | 'OVERDUE'
  | 'RETURNED'

export interface OrderCurrency {
  code: string
  symbol: string
}

export interface OrderCarrier {
  id: string
  name: string
  logo?: string
}

export interface ShipInfo {
  carrier?: OrderCarrier
  amount?: number
  accountNumber?: string
  trackingNumber?: string
  pickupLocation?: { id: string; name: string }
}

export interface OrderTax {
  name: string
  rate: number
  amount: number
}

export interface OrderDiscount {
  id: string
  name: string
  type: 'PERCENT' | 'FIXED'
  amount: number
  savings: number
  appliesTo?: string
}

export interface OrderPrice {
  currency: OrderCurrency
  subtotal: number
  subTotal?: number
  total: number
  taxTotal: number
  discountTotal: number
  taxes: OrderTax[]
  discounts: OrderDiscount[]
  shipInfo: ShipInfo
  paymentTerm?: string
  paymentMethod?: string
}

export interface OrderItemSku {
  id: string
  productId: string
  productName: string
  description?: string
  inventoryType?: string
}

export interface InventoryLot {
  inventory: { lotSerial: string }
}

export interface OrderItemPriceInfo {
  subtotal: number
  taxes: OrderTax[]
}

export interface OrderItem {
  id: string
  lineNumber: number
  orderId: string
  sku: OrderItemSku
  quantityOrdered: number
  quantityBackordered?: number
  quantityShipped?: number
  unitPrice: number
  tax: string
  salesTerms: 'OUTRIGHT' | 'EXCHANGE'
  dropship?: boolean
  inventoryType?: string
  inventoryLots?: InventoryLot[]
  priceInfo?: OrderItemPriceInfo
}

export interface OrderCustomer {
  id: string
  name: string
  creditInfo?: { paymentMethod?: string }
}

export interface OrderSuborder {
  id: string
  state: OrderStatus
  items: OrderItem[]
  price: OrderPrice
  invoice?: { id: string }
  parentOrderId?: string
}

export interface OrderWarehouse {
  id: string
  name: string
  address?: { country: string }
}

export interface OrderSoldBy {
  id: string
  name: string
  email?: string
}

export interface OrderAddress {
  address1?: string
  address2?: string
  address3?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  contactName?: string
  companyName?: string
  phone?: string
}

export interface Order {
  id: string
  state: OrderStatus
  customer: OrderCustomer
  customerName?: string
  billToAddress: OrderAddress
  shipToAddress: OrderAddress
  price: OrderPrice
  items: OrderItem[]
  suborders: OrderSuborder[]
  parentOrderId?: string
  warehouse: OrderWarehouse
  soldBy?: OrderSoldBy
  instructions?: string
  poNumber?: string
  notes?: string
  creationDate: string
  submittedDate: string | null
  requestedShipDate: string | null
  lastModifiedDate: string
  shippedDate: string | null
  quoteDate?: string | null
  invoice?: { id: string }
}

export interface OrderSummary {
  id: string
  customerName: string
  state: OrderStatus
  submittedDate: string | null
  shippedDate: string | null
  warehouseName?: string
  total: number
}

export interface OrderSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  sortBy?: string
  sortDirection?: '+' | '-'
}

export interface OrderStateChangeRequest {
  id: string
  state: OrderStatus
}

export interface EmailRequest {
  id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  content: string
  type: 'SALESORDER' | 'SALESQUOTE'
}

export interface PrintRequest {
  id: string
  qty: number
}

export type OrderPagedResult = PagedResult<OrderSummary>
