import type { PagedResult } from '../../shared/types'

// ── Pick ──────────────────────────────────────────────────────────────────────

export interface PickSlipItem {
  skuId: string
  productName: string
  sku?: string
  lotSerial?: string
  quantityOrdered: number
  quantityPicked: number
  location?: string
}

export interface PickSlip {
  id: string
  orderId: string
  customerName: string
  state: string
  creationDate: string
  items: PickSlipItem[]
}

export interface PickOrderRequest {
  id: string
  items: { skuId: string; quantity: number }[]
}

export interface PrintRequest {
  id: string
  qty: number
}

// ── Pack ──────────────────────────────────────────────────────────────────────

export interface LotOption {
  id: string
  name: string
  quantity: number
}

export interface PackOrderItem {
  id: string
  lineNumber: number
  productName: string
  skuId: string
  lotSerial: string
  inventoryId: string
  quantityOrdered: number
  quantityPacked: number
  lots: LotOption[]
}

export interface PackOrder {
  orderId: string
  customerName?: string
  state?: string
  items: PackOrderItem[]
}

export interface PackItemRequest {
  orderId: string
  inventoryId: string
  quantity: number
}

export interface PackOrderRequest {
  id: string
  items: {
    skuId: string
    lotSerial: string
    quantity: number
    itemId: string
    inventoryId: string
  }[]
}

// ── Ship ──────────────────────────────────────────────────────────────────────

export interface Carrier {
  id: string
  name: string
  logo?: string
  accountNumber?: string
}

export interface ShipOrderRequest {
  id: string
  carrierId: string
  trackingNumber: string
  amount: number
}

// ── Transfer ──────────────────────────────────────────────────────────────────

export type TransferState = 'NEW' | 'COMPLETE'

export interface PhysicalWarehouse {
  id: string
  name: string
  address?: string
}

export interface TransferItem {
  id: string
  transferId: string
  inventoryId: string
  skuId: string
  productName: string
  lotSerial?: string
  quantity: number
}

export interface Transfer {
  id: string
  state: TransferState
  fromWarehouse: PhysicalWarehouse
  toWarehouse: PhysicalWarehouse
  items: TransferItem[]
  creationDate?: string
}

export interface TransferSummary {
  id: string
  state: TransferState
  fromWarehouse: PhysicalWarehouse
  toWarehouse: PhysicalWarehouse
  itemCount: number
  creationDate?: string
}

export interface SaveTransferRequest {
  fromWarehouse: string
  toWarehouse: string
}

export interface AddTransferItemRequest {
  transferId: string
  inventoryId: string
}

export interface RemoveTransferItemRequest {
  transferId: string
  id: string
}

// ── Inventory search ──────────────────────────────────────────────────────────

export interface AvailableInventory {
  id: string
  skuId: string
  productName: string
  sku?: string
  lotSerial?: string
  quantity: number
  warehouse?: string
  location?: string
}

export interface InventorySearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  filters?: string[]
}

export type PickableOrderSummary = {
  id: string
  customerName: string
  state: string
  creationDate: string
}

export type PackableOrderSummary = {
  id: string
  customerName: string
  state: string
  creationDate: string
}

export type ShippableOrderSummary = {
  id: string
  customerName: string
  state: string
  creationDate: string
}

export type WarehouseSearchRequest = {
  keyword: string
  page: number
  resultsPerPage: number
}

export type PickablePagedResult = PagedResult<PickableOrderSummary>
export type PackablePagedResult = PagedResult<PackableOrderSummary>
export type ShippablePagedResult = PagedResult<ShippableOrderSummary>
export type AvailableInventoryPagedResult = PagedResult<AvailableInventory>
