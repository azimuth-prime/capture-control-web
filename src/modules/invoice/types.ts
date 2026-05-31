export type InvoiceState = 'NEW' | 'INVOICED' | 'PAID' | 'CANCELLED' | 'OVERDUE'

export type PaymentMethod = 'CREDIT_CARD' | 'CHECK' | 'WIRE' | 'CASH'

export type SortDirection = '+' | '-'

export interface InvoiceListItem {
  id: string
  orderId: string
  customerName: string
  invoiceDate: string
  dueDate: string
  status: InvoiceState
  totalAmount: number
}

export interface InvoiceSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  sortBy?: string
  sortDirection?: SortDirection
}

export interface InvoiceCurrency {
  code: string
  symbol: string
}

export interface InvoiceCustomer {
  id: string
  name: string
}

export interface InvoiceItemSku {
  productId: string
  productName: string
  price: number
}

export interface InvoiceItemPriceInfo {
  subtotal: number
}

export interface InvoiceItem {
  sku: InvoiceItemSku
  quantityShipped: number
  unitPrice: number
  priceInfo: InvoiceItemPriceInfo
}

export interface InvoiceDiscount {
  name: string
  amount: number
  savings: number
}

export interface InvoiceTaxLine {
  name: string
  rate: number
  amount: number
}

export interface InvoiceShipInfo {
  amount: number
  carrier?: string
}

export interface InvoicePrice {
  subtotal: number
  total: number
  currency: InvoiceCurrency
  discounts: InvoiceDiscount[]
  taxes: InvoiceTaxLine[]
  shipInfo: InvoiceShipInfo
  rawSubtotal?: number
  discountTotal?: number
  taxTotal?: number
}

export interface InvoiceAddress {
  address1?: string
  address2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  phone?: string
  contactName?: string
  companyName?: string
}

export interface InvoiceOrder {
  id: string
  customer: InvoiceCustomer
  items: InvoiceItem[]
  price: InvoicePrice
  billToAddress?: InvoiceAddress
  shipToAddress?: InvoiceAddress
}

export interface Invoice {
  id: string
  state: InvoiceState
  paymentTerm?: string
  creationDate: string
  invoiceDate: string
  lastModifiedDate: string
  dueDate: string
  total: number
  amountPaid: number
  notes?: string
  order: InvoiceOrder
}

export interface ReceivePaymentRequest {
  id: string
  paymentMethod: PaymentMethod
  amount: number
  notes: string
}

export interface PrintRequest {
  id: string
  qty: number
}

export interface SendEmailRequest {
  id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  content: string
}

export interface PaymentFormValues {
  paymentMethod: PaymentMethod
  amount: number
  notes: string
}

export interface EmailFormValues {
  to: string
  cc: string
  bcc: string
  subject: string
  content: string
}

export interface InvoiceToast {
  id: number
  activity: string
  message: string
  success: boolean
}
