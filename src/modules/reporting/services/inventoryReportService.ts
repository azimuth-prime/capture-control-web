import axiosInstance from '../../../auth/axiosInstance'
import type {
  KeywordPageRequest,
  DateRangeRequest,
  SpotCheckRequest,
  InventoryAdjustmentRow,
  InventoryReceiptRow,
  InventoryTransferRow,
  SpotCountRow,
  Audit,
  SaveAuditRequest,
  InventoryCountPagedResult,
  ProductAvailabilityPagedResult,
  InventoryAvailabilityPagedResult,
  AuditPagedResult,
} from '../types'

export const inventoryReportService = {
  // ── Keyword search ─────────────────────────────────────────────────────────

  findInventoryByKeyword: (data: KeywordPageRequest) =>
    axiosInstance.post<InventoryCountPagedResult>('/capture/inventory/reporting/search', data),

  findProductAvailability: (data: KeywordPageRequest) =>
    axiosInstance.post<ProductAvailabilityPagedResult>(
      '/capture/product/reporting/product/availability',
      data,
    ),

  productAvailabilityDownload: (data: KeywordPageRequest) =>
    axiosInstance.post<Blob>('/capture/product/reporting/product/availability/download', data, {
      responseType: 'blob',
    }),

  findInventoryAvailability: (data: KeywordPageRequest) =>
    axiosInstance.post<InventoryAvailabilityPagedResult>(
      '/capture/inventory/reporting/availability',
      data,
    ),

  inventoryAvailabilityDownload: (data: KeywordPageRequest) =>
    axiosInstance.post<Blob>('/capture/inventory/reporting/availability/download', data, {
      responseType: 'blob',
    }),

  // ── Date-range reports ─────────────────────────────────────────────────────

  findAdjustmentsByDates: (data: DateRangeRequest) =>
    axiosInstance.post<InventoryAdjustmentRow[]>('/capture/inventory/reporting/adjustments', data),

  findReceiptsByDates: (data: DateRangeRequest) =>
    axiosInstance.post<InventoryReceiptRow[]>('/capture/inventory/reporting/receipts', data),

  findTransfersByDates: (data: DateRangeRequest) =>
    axiosInstance.post<InventoryTransferRow[]>('/capture/inventory/reporting/transfers', data),

  // ── Spot count ─────────────────────────────────────────────────────────────

  findSpotCheckByLocations: (data: SpotCheckRequest) =>
    axiosInstance.post<SpotCountRow[]>('/capture/inventory/reporting/spotcheck/location', data),

  findSpotCheckByProducts: (data: SpotCheckRequest) =>
    axiosInstance.post<SpotCountRow[]>('/capture/inventory/reporting/spotcheck/product', data),

  // ── Audit ──────────────────────────────────────────────────────────────────

  findAllAudits: (data: KeywordPageRequest) =>
    axiosInstance.post<AuditPagedResult>('/capture/audit/audits', data),

  findAuditById: (id: string) =>
    axiosInstance.get<Audit>(`/capture/audit/${id}`),

  saveAudit: (data: SaveAuditRequest) =>
    axiosInstance.post<Audit>('/capture/audit', data),
}
