import type { OrderItem } from '../order/types'

export type RMAState =
  | 'DRAFT'
  | 'ISSUED'
  | 'RECEIVED'
  | 'COMPLETE'
  | 'CANCELLED'

export interface RMAItemReason {
  id: string
  name: string
}

export interface RMAItemInventory {
  id: string
  lotSerial: string
  productName: string
  productDescription?: string
}

export interface RMAItemPriceInfo {
  taxes: { name: string; rate: number; amount: number }[]
}

export interface RMAItem {
  id: string
  lineNumber: number
  orderItemId: string
  quantityReturned: number
  maxQuantity: number
  reasonId?: string
  priceInfo?: RMAItemPriceInfo
  inventory: RMAItemInventory
}

export interface RMAOrder {
  id: string
  items: OrderItem[]
}

export interface RMA {
  id: string
  state: RMAState
  order: RMAOrder
  items: RMAItem[]
  expectedReturnDate: string | null
  issueDate: string | null
  creationDate: string
  lastModifiedDate: string
}

export interface RMACreateRequest {
  orderId: string
  items: {
    orderItemId: string
    inventoryId: string
    quantityReturned: number
    lineNumber: number
    reasonId: string
  }[]
}

export interface RMASaveItemsRequest {
  rmaId: string
  items: {
    id: string
    inventoryId: string
    orderItemId: string
    quantityReturned: number
    lineNumber: number
    reasonId: string
  }[]
}
