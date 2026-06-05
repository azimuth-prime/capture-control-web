export interface TimeSeriesPoint {
  key: string
  value: number
}

export interface TopSeller {
  id: string
  name: string
  quantity: number
  total: number
}

export interface PLSummary {
  totalRevenue: number
  totalCost: number
}

export interface PurchaseStateRow {
  state: string
  qty: number
  total: number
}

export interface InvoiceStatusRow {
  key: string
  value: number
}

export interface WMSOrderRow {
  id: string
  customerName?: string
  warehouseName?: string
  submittedDate?: string
  shipRequestDate?: string
  total?: number
}

export interface WMSOrders {
  ordersToPick: WMSOrderRow[]
  ordersToPack: WMSOrderRow[]
  ordersToShip: WMSOrderRow[]
}

export interface OrderConversionItem {
  orderDate: string
  conversionRate: number
}

export interface OrderConversion {
  convertedOrders: number
  totalOrders: number
  items: OrderConversionItem[]
}

export interface POAwaitingRow {
  id: string
  vendor?: { id?: string; name?: string }
  warehouse?: { id?: string; name?: string }
  issueDate?: string
  creationDate?: string
  createdBy?: string
}

export interface BackorderedItem {
  skuId?: string
  name?: string
  vendor?: { name?: string }
  qtyBackOrdered?: number
  qtyOnPO?: number
  backOrderedSince?: string
}
