import axiosInstance from '../../../auth/axiosInstance'
import type {
  SKU,
  Inventory,
  InventoryTransaction,
  SkuConfig,
  ColorSwatch,
  Sizing,
  SKUDimensions,
  SkuLocation,
  CreateInventoryRequest,
  PrintLabelRequest,
  SkuSearchRequest,
  SaleItem,
} from '../types'
import type { PagedResult } from '../../../shared/types'

export const skuService = {
  // ── SKU ────────────────────────────────────────────────────────────────────

  findById: (id: string) =>
    axiosInstance.get<SKU>(`/capture/sku/${id}`),

  findSkuConfig: () =>
    axiosInstance.get<SkuConfig>('/capture/sku/config'),

  saveSku: (data: Partial<SKU>) =>
    axiosInstance.post<SKU>('/capture/sku', data),

  saveSkuDimensions: (id: string, data: SKUDimensions) =>
    axiosInstance.post<SKU>(`/capture/sku/dimensions/${id}`, data),

  findLocationsBySkuId: (id: string) =>
    axiosInstance.get<SkuLocation[]>(`/capture/sku/location/${id}`),

  findComponentSkuByKeyword: (data: SkuSearchRequest) =>
    axiosInstance.post<SKU[]>('/capture/sku/search', data),

  findSkuByKeyword: (data: SkuSearchRequest) =>
    axiosInstance.put<SKU[]>('/capture/sku/search', data),

  findSkuSales: (data: { keyword: string; page: number; resultsPerPage: number }) =>
    axiosInstance.post<PagedResult<SaleItem>>('/capture/sku/sales', data),

  uploadSkuMedia: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post<SKU>(`/capture/sku/media/${id}`, form)
  },

  deleteSkuMedia: (id: string) =>
    axiosInstance.delete<void>(`/capture/sku/media/${id}`),

  deletePriceById: (id: string) =>
    axiosInstance.delete<void>(`/capture/sku/price/${id}`),

  // ── Config (color swatches, sizings) ───────────────────────────────────────

  saveColorSwatch: (data: Partial<ColorSwatch>) =>
    axiosInstance.post<ColorSwatch>('/capture/sku/config/color', data),

  deleteColorSwatch: (id: string) =>
    axiosInstance.delete<void>(`/capture/sku/config/color/${id}`),

  saveSizing: (data: Partial<Sizing>) =>
    axiosInstance.post<Sizing>('/capture/sku/config/sizing', data),

  deleteSizing: (id: string) =>
    axiosInstance.delete<void>(`/capture/sku/config/sizing/${id}`),

  // ── Inventory ──────────────────────────────────────────────────────────────

  findInventoryById: (id: string) =>
    axiosInstance.get<Inventory>(`/capture/inventory/${id}`),

  findInventoryBySkuId: (id: string) =>
    axiosInstance.get<Inventory[]>(`/capture/inventory/sku/${id}`),

  findTransactionsByInventoryId: (id: string) =>
    axiosInstance.get<InventoryTransaction[]>(`/capture/inventory/transactions/${id}`),

  createInventory: (data: CreateInventoryRequest) =>
    axiosInstance.post<Inventory>('/capture/inventory', data),

  updateInventory: (data: Partial<Inventory>) =>
    axiosInstance.put<Inventory>('/capture/inventory', data),

  printLabels: (data: PrintLabelRequest) =>
    axiosInstance.post<void>('/capture/inventory/printlabel', data),

  printRFIDTag: (tagId: string, inventoryId: string) =>
    axiosInstance.get<void>(`/capture/inventory/printtag/${tagId}/${inventoryId}`),

  checkLotExists: (data: { warehouseId: string; serialNumber: string; skuId: string }) =>
    axiosInstance.post<void>('/capture/inventory/lot/lookup', data),

  checkSerialExists: (data: { warehouseId: string; serialNumber: string; skuId: string }) =>
    axiosInstance.post<void>('/capture/inventory/serial/lookup', data),

  uploadInventoryMedia: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post<Inventory>(`/capture/inventory/media/${id}`, form)
  },

  deleteInventoryMedia: (id: string) =>
    axiosInstance.delete<void>(`/capture/inventory/media/${id}`),
}
