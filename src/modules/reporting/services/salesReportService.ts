import axiosInstance from '../../../auth/axiosInstance'
import type {
  DateRangeRequest,
  SalesOrderSummary,
  CancelledOrderRow,
  BackorderedOrderRow,
  OverdueOrderRow,
  SalespersonSummary,
  CustomerSummary,
} from '../types'

export const salesReportService = {
  findOrdersByDates: (data: DateRangeRequest) =>
    axiosInstance.post<SalesOrderSummary[]>('/capture/sales/report/summarybydate', data),

  findCancelledOrdersByDates: (data: DateRangeRequest) =>
    axiosInstance.post<CancelledOrderRow[]>('/capture/order/reporting/cancelled', data),

  findBackorderedOrders: () =>
    axiosInstance.get<BackorderedOrderRow[]>('/capture/order/reporting/backordered'),

  findOverdueOrders: () =>
    axiosInstance.get<OverdueOrderRow[]>('/capture/order/reporting/overdue'),

  findOrdersBySalesperson: (data: DateRangeRequest) =>
    axiosInstance.post<SalespersonSummary[]>('/capture/order/reporting/sales/salesperson', data),

  findOrdersByCustomer: (data: DateRangeRequest) =>
    axiosInstance.post<CustomerSummary[]>('/capture/order/reporting/sales/customer', data),
}
