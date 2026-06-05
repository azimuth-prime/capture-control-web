import axiosInstance from '../../../auth/axiosInstance'
import type {
  PickSlip,
  PickOrderRequest,
  PrintRequest,
  PackOrder,
  PackItemRequest,
  PackOrderRequest,
  Transfer,
  TransferSummary,
  SaveTransferRequest,
  AddTransferItemRequest,
  RemoveTransferItemRequest,
  PhysicalWarehouse,
  Warehouse,
  PickablePagedResult,
  PackablePagedResult,
  AvailableInventoryPagedResult,
  WarehouseSearchRequest,
  InventorySearchRequest,
} from '../types'

export const warehouseService = {
  // ── Pick ───────────────────────────────────────────────────────────────────

  findPickSlipById: (id: string) =>
    axiosInstance.get<PickSlip>(`/capture/picking/${id}`),

  findPickableOrderBykeyword: (data: WarehouseSearchRequest) =>
    axiosInstance.post<PickablePagedResult>('/capture/picking/search', data),

  pickOrder: (data: PickOrderRequest) =>
    axiosInstance.post<void>('/capture/picking', data),

  printPickSlip: (data: PrintRequest) =>
    axiosInstance.post<void>('/capture/picking/print', data),

  // ── Pack ───────────────────────────────────────────────────────────────────

  findPackableOrderBykeyword: (data: WarehouseSearchRequest) =>
    axiosInstance.post<PackablePagedResult>('/capture/packing/search', data),

  findOrderForPacking: (id: string) =>
    axiosInstance.get<PackOrder>(`/capture/packing/${id}`),

  packItem: (data: PackItemRequest) =>
    axiosInstance.post<PackOrder>('/capture/packing', data),

  packOrder: (data: PackOrderRequest) =>
    axiosInstance.post<void>('/capture/packing/order', data),

  printPackSlip: (data: PrintRequest) =>
    axiosInstance.post<void>('/capture/packing/print', data),

  downloadPackingSlipPDF: (id: string) =>
    axiosInstance.get<Blob>(`/capture/packing/pdf/${id}`, { responseType: 'blob' }),

  // ── Transfer ───────────────────────────────────────────────────────────────

  findAllOpenTransfers: () =>
    axiosInstance.get<TransferSummary[]>('/capture/warehouse/transfer/open'),

  findTransferById: (id: string) =>
    axiosInstance.get<Transfer>(`/capture/warehouse/transfer/${id}`),

  saveTransfer: (data: SaveTransferRequest) =>
    axiosInstance.post<Transfer>('/capture/warehouse/transfer', data),

  addItemToTransfer: (data: AddTransferItemRequest) =>
    axiosInstance.post<Transfer>('/capture/warehouse/transfer/item', data),

  removeItemFromTransfer: (data: RemoveTransferItemRequest) =>
    axiosInstance.put<Transfer>('/capture/warehouse/transfer/item', data),

  transferStock: (id: string) =>
    axiosInstance.get<Transfer>(`/capture/warehouse/transfer/confirm/${id}`),

  deleteTransferById: (id: string) =>
    axiosInstance.delete<void>(`/capture/warehouse/transfer/${id}`),

  // ── Warehouse / Inventory ──────────────────────────────────────────────────

  findAllPhysicalWarehouses: () =>
    axiosInstance.get<PhysicalWarehouse[]>('/capture/warehouse/physical'),

  findAllWarehouses: () =>
    axiosInstance.get<Warehouse[]>('/capture/warehouse'),

  findWarehouseById: (id: string) =>
    axiosInstance.get<Warehouse>(`/capture/warehouse/${id}`),

  saveWarehouse: (data: Partial<Warehouse>) =>
    axiosInstance.post<Warehouse>('/capture/warehouse', data),

  findAvailableInventoryByKeyword: (data: InventorySearchRequest) =>
    axiosInstance.post<AvailableInventoryPagedResult>('/capture/inventory/search/available', data),
}
