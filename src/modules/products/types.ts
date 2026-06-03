import type { PagedResult } from '../../shared/types'

export type InventoryType = 'INVENTORIED' | 'DROPSHIP' | 'INFINITE'
export type ControlType = 'LOT' | 'SERIAL'
export type SkuType = 'SIMPLESKU' | 'SKUBUNDLE'
export type ProductType = 'FINISHED' | 'COMPONENT' | 'SERVICE' | 'OTHER'

export interface ColorSwatch {
  id: string
  name: string
  hexCode: string
}

export interface Sizing {
  id: string
  name: string
}

export interface StockUnit {
  id: string
  name: string
  description?: string
}

export interface Manufacturer {
  name?: string
  productId?: string
  url?: string
}

export interface ProductWarehouse {
  id: string
  name: string
  description?: string
}

export interface SKUPrice {
  id: string
  currencyCode: string
  price: number
}

export interface SKUDimensions {
  weight?: number
  length?: number
  width?: number
  height?: number
  weightUnit?: string
  dimensionUnit?: string
}

export interface SKUStockCount {
  onHand: number
  available: number
  ordered: number
  backordered: number
  onPO: number
  outForService?: number
}

export interface MediaItem {
  id: string
  url: string
  mediaType?: string
  isPrimary?: boolean
}

export interface InventoryTransaction {
  id: string
  type: string
  quantity: number
  date: string
  description?: string
  reference?: string
}

export interface InventoryStockCount {
  onHand: number
  reserved: number
  available: number
}

export interface Inventory {
  id: string
  skuId: string
  productId?: string
  productName?: string
  lotSerial?: string
  state: string
  warehouse: ProductWarehouse
  receivedDate?: string | null
  expiryDate?: string | null
  stockCount?: InventoryStockCount
  media?: MediaItem[]
}

export interface SkuLocation {
  warehouseId: string
  warehouseName: string
  locationCode?: string
  quantity?: number
}

export interface SKUVendorItem {
  id?: string
  supplierId: string
  supplierName?: string
  vendorProductId?: string
  vendorSkuId?: string
  unitCost?: number
  leadTime?: number
  stockUnit?: string
}

export interface SKUComponent {
  id: string
  componentSkuId: string
  productName?: string
  color?: string
  size?: string
  quantity: number
}

export interface SaleItem {
  id: string
  date: string
  quantity: number
  orderId: string
  customerName?: string
}

export interface SKU {
  id: string
  productId: string
  productName?: string
  skuType: SkuType
  inventoryType: InventoryType
  controlType?: ControlType
  colorSwatch?: ColorSwatch
  sizing?: Sizing
  upc?: string
  availabilityDate?: string | null
  creationDate?: string
  lastModifiedDate?: string
  stockThreshold?: number
  prices?: SKUPrice[]
  dimensions?: SKUDimensions
  stockCount: SKUStockCount
  inventory?: Inventory[]
  media?: MediaItem[]
  vendors?: SKUVendorItem[]
  components?: SKUComponent[]
}

export interface SKUSummary {
  id: string
  color?: string
  size?: string
  inventoryType?: InventoryType
  stockCount: SKUStockCount
  prices?: SKUPrice[]
  warehouses?: string[]
}

export interface Product {
  id: string
  name: string
  description?: string
  altId?: string
  productType?: ProductType
  controlType?: ControlType
  availabilityDate?: string | null
  taxable?: boolean
  stockUnit?: string
  manufacturer?: Manufacturer
  taxes?: string[]
  skus?: SKUSummary[]
  media?: MediaItem[]
  creationDate?: string
  lastModifiedDate?: string
}

export interface ProductSummary {
  id: string
  name: string
  description?: string
  altId?: string
  productType?: string
  thumbnail?: string
  warehouses?: string[]
  onHand?: number
  available?: number
}

export interface SkuConfig {
  colorSwatches: ColorSwatch[]
  sizings: Sizing[]
  warehouses: ProductWarehouse[]
  stockUnits: StockUnit[]
}

export interface ProductSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
}

export interface InventorySearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
}

export interface CreateInventoryRequest {
  skuId: string
  warehouse: { id: string; name: string; description?: string }
  lotSerial?: string
  state?: string
  receivedDate?: string | null
  expiryDate?: string | null
}

export interface PrintLabelRequest {
  inventoryId: string
  productLabelQty: number
  rfidLabelQty?: number
}

export interface SkuSearchRequest {
  keyword: string
  page?: number
  resultsPerPage?: number
}

export type ProductPagedResult = PagedResult<ProductSummary>
export type InventoryPagedResult = PagedResult<Inventory>
export type SalesPagedResult = PagedResult<SaleItem>
