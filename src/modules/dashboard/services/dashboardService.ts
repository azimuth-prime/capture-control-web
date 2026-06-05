import axiosInstance from '../../../auth/axiosInstance'
import type {
  TimeSeriesPoint,
  TopSeller,
  PLSummary,
  PurchaseStateRow,
  InvoiceStatusRow,
  WMSOrders,
  OrderConversion,
  POAwaitingRow,
  BackorderedItem,
} from '../types'

export const dashboardService = {
  // ── Orders / Revenue ───────────────────────────────────────────────────────

  findOrdersByDay: () =>
    axiosInstance.get<TimeSeriesPoint[]>('/capture/reporting/orders/day'),

  findOrdersByMonth: () =>
    axiosInstance.get<TimeSeriesPoint[]>('/capture/reporting/orders/month'),

  findRevenueByDay: () =>
    axiosInstance.get<TimeSeriesPoint[]>('/capture/reporting/revenue/day'),

  findRevenueByMonth: () =>
    axiosInstance.get<TimeSeriesPoint[]>('/capture/reporting/revenue/month'),

  findOrderConversionByDay: () =>
    axiosInstance.get<OrderConversion>('/capture/reporting/orders/conversion/day'),

  findOrderConversionByMonth: () =>
    axiosInstance.get<OrderConversion>('/capture/reporting/orders/conversion/month'),

  // ── Top Sellers ────────────────────────────────────────────────────────────

  findTopSellersLast30Days: () =>
    axiosInstance.get<TopSeller[]>('/capture/reporting/topsellers/last30'),

  findTopSellersLastYear: () =>
    axiosInstance.get<TopSeller[]>('/capture/reporting/topsellers/lastyear'),

  // ── Admin-only ─────────────────────────────────────────────────────────────

  findPLLast30Days: () =>
    axiosInstance.get<PLSummary>('/capture/reporting/revenue/pl/last30'),

  findPLLastYear: () =>
    axiosInstance.get<PLSummary>('/capture/reporting/revenue/pl/lastyear'),

  findPurchaseOrderStateLast30: () =>
    axiosInstance.get<PurchaseStateRow[]>('/capture/reporting/purchase/state/last30'),

  findPurchaseOrderStateLastYear: () =>
    axiosInstance.get<PurchaseStateRow[]>('/capture/reporting/purchase/state/lastyear'),

  findInvoiceStatus: () =>
    axiosInstance.get<InvoiceStatusRow[]>('/capture/reporting/invoice'),

  // ── WMS ───────────────────────────────────────────────────────────────────

  findWMSOrders: () =>
    axiosInstance.get<WMSOrders>('/capture/warehouse/orders'),

  // ── Products dashboard ─────────────────────────────────────────────────────

  findAvgInventoryValueLast30: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/value/last30days'),

  findAvgInventoryValueLast6Months: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/value/last6months'),

  findAvgInventoryValueLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/value/lastyear'),

  findInventoryTurnoverLast30: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/turnover/last30days'),

  findInventoryTurnoverLast6Months: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/turnover/last6months'),

  findInventoryTurnoverLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/turnover/lastyear'),

  findDaysSalesLast30: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/dayssales/last30days'),

  findDaysSalesLast6Months: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/dayssales/last6months'),

  findDaysSalesLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/dayssales/lastyear'),

  findInventorySalesRatioLast30: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/sales/ratio/30day'),

  findInventorySalesRatioLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/sales/ratio/year'),

  findAvgInventoryPeriodLast30: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/period/30days'),

  findAvgInventoryPeriodLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/inventory/period/year'),

  // ── Purchase dashboard ─────────────────────────────────────────────────────

  findPOAwaitingApproval: () =>
    axiosInstance.get<POAwaitingRow[]>('/capture/purchase/open/approval'),

  findPOAwaitingReceipt: () =>
    axiosInstance.post<POAwaitingRow[]>('/capture/purchase/open/receipt', {}),

  findBackorderedItems: () =>
    axiosInstance.get<BackorderedItem[]>('/capture/order/backorders/items'),

  findAvgPurchaseCycleLast30: () =>
    axiosInstance.get<number>('/capture/reporting/purchase/lifecycle/last30'),

  findAvgPurchaseCycleLastYear: () =>
    axiosInstance.get<number>('/capture/reporting/purchase/lifecycle/lastyear'),
}
