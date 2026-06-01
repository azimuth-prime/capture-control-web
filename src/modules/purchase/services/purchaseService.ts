import type { AxiosResponse } from 'axios'
import axiosInstance from '../../../auth/axiosInstance'
import type {
  PurchaseOrder,
  POSummary,
  POSearchRequest,
  POStateChangeRequest,
  POReceiveItem,
  ReceiveStockRequest,
  SavePOItemsRequest,
  PriceList,
  PriceListSummary,
  SavePLItemsRequest,
  RestockItem,
  POInvoice,
  POInvoiceItem,
  Tax,
} from '../types'
import type { PagedResult } from '../../../shared/types'

export const purchaseService = {
  findPosByKeyword: (data: POSearchRequest): Promise<AxiosResponse<PagedResult<POSummary>>> =>
    axiosInstance.post<PagedResult<POSummary>>('/capture/purchase/search', data),

  findById: (id: string): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.get<PurchaseOrder>(`/capture/purchase/${id}`),

  save: (data: Partial<PurchaseOrder>): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase', data),

  changeState: (data: POStateChangeRequest): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/state', data),

  issuePO: (id: string): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.get<PurchaseOrder>(`/capture/purchase/issue/${id}`),

  savePOItems: (data: SavePOItemsRequest): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/item', data),

  getPOForReceiving: (id: string): Promise<AxiosResponse<{ items: POReceiveItem[] }>> =>
    axiosInstance.get<{ items: POReceiveItem[] }>(`/capture/purchase/receive/${id}`),

  receiveStock: (data: ReceiveStockRequest): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/receive', data),

  findApplicableTaxes: (id: string): Promise<AxiosResponse<Tax[]>> =>
    axiosInstance.get<Tax[]>(`/capture/purchase/taxes/${id}`),

  setCarrier: (data: { id: string; carrierId: string }): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/carrier', data),

  findItemsForPOInvoice: (id: string): Promise<AxiosResponse<POInvoiceItem[]>> =>
    axiosInstance.get<POInvoiceItem[]>(`/capture/purchase/invoicable/${id}`),

  repriceInvoice: (data: { id: string; items: POInvoiceItem[] }): Promise<AxiosResponse<POInvoice>> =>
    axiosInstance.put<POInvoice>('/capture/purchase/invoice', data),

  addInvoice: (data: { purchaseOrderId: string; items: POInvoiceItem[] }): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/invoice', data),

  findPOInvoice: (id: string): Promise<AxiosResponse<POInvoice>> =>
    axiosInstance.get<POInvoice>(`/capture/purchase/invoice/${id}`),

  printPurchaseOrder: (id: string): Promise<AxiosResponse<void>> =>
    axiosInstance.get<void>(`/capture/purchase/print/${id}`),

  downloadPOPDF: (id: string): Promise<AxiosResponse<Blob>> =>
    axiosInstance.get<Blob>(`/capture/purchase/pdf/${id}`, { responseType: 'blob' }),

  reorderPO: (data: { purchaseOrderId: string; supplierId?: string; warehouseId?: string }): Promise<AxiosResponse<PurchaseOrder>> =>
    axiosInstance.post<PurchaseOrder>('/capture/purchase/reorder', data),

  findAllPriceLists: (): Promise<AxiosResponse<PriceListSummary[]>> =>
    axiosInstance.get<PriceListSummary[]>('/capture/purchase/pricelist'),

  findPriceListBySupplierId: (id: string): Promise<AxiosResponse<PriceList>> =>
    axiosInstance.get<PriceList>(`/capture/purchase/pricelist/${id}`),

  savePLItems: (data: SavePLItemsRequest): Promise<AxiosResponse<PriceList>> =>
    axiosInstance.post<PriceList>('/capture/purchase/pricelist/items', data),

  deletePriceListItem: (id: string): Promise<AxiosResponse<void>> =>
    axiosInstance.delete<void>(`/capture/purchase/pricelist/${id}`),

  findRestockByKeyword: (data: { keyword: string; page: number; resultsPerPage: number }): Promise<AxiosResponse<PagedResult<RestockItem>>> =>
    axiosInstance.post<PagedResult<RestockItem>>('/capture/purchase/pricelist/search', data),

  findPurchaseOrdersByState: (data: {
    keyword?: string
    page: number
    resultsPerPage: number
    filters: { state: string }[]
  }): Promise<AxiosResponse<PagedResult<POSummary>>> =>
    axiosInstance.post<PagedResult<POSummary>>('/capture/purchase/report/state', data),
}
