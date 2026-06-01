import type { AxiosResponse } from 'axios'
import axiosInstance from '../../../auth/axiosInstance'
import type { Address } from '../../../shared/types'
import type {
  ServiceOrder,
  ServiceOrderPagedResult,
  ServiceOrderSearchRequest,
  ServiceOrderStateChangeRequest,
  ServiceOrderCarrierRequest,
  ServiceOrderSaveItemsRequest,
  ServiceOrderPrintRequest,
  ServiceOrderAddInvoiceRequest,
  ServiceOrderInvoice,
  ServiceOrderInvoicableItem,
} from '../types'

export const serviceService = {
  findByKeyword: (data: ServiceOrderSearchRequest): Promise<AxiosResponse<ServiceOrderPagedResult>> =>
    axiosInstance.post<ServiceOrderPagedResult>('/capture/service/search', data),

  findById: (id: string): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.get<ServiceOrder>(`/capture/service/${id}`),

  save: (data: Partial<ServiceOrder>): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.post<ServiceOrder>('/capture/service', data),

  changeState: (data: ServiceOrderStateChangeRequest): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.post<ServiceOrder>('/capture/service/state', data),

  issueServiceOrder: (id: string): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.get<ServiceOrder>(`/capture/service/issue/${id}`),

  saveItems: (data: ServiceOrderSaveItemsRequest): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.post<ServiceOrder>('/capture/service/item', data),

  findApplicableTaxes: (id: string): Promise<AxiosResponse<string[]>> =>
    axiosInstance.get<string[]>(`/capture/service/taxes/${id}`),

  setCarrier: (data: ServiceOrderCarrierRequest): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.post<ServiceOrder>('/capture/service/carrier', data),

  findItemsForServiceOrderInvoice: (id: string): Promise<AxiosResponse<ServiceOrderInvoicableItem[]>> =>
    axiosInstance.get<ServiceOrderInvoicableItem[]>(`/capture/service/invoicable/${id}`),

  addInvoice: (data: ServiceOrderAddInvoiceRequest): Promise<AxiosResponse<ServiceOrderInvoice>> =>
    axiosInstance.post<ServiceOrderInvoice>('/capture/service/invoice', data),

  findSOInvoice: (id: string): Promise<AxiosResponse<ServiceOrderInvoice>> =>
    axiosInstance.get<ServiceOrderInvoice>(`/capture/service/invoice/${id}`),

  saveSupplierAddress: (data: Address, id: string): Promise<AxiosResponse<ServiceOrder>> =>
    axiosInstance.post<ServiceOrder>(`/capture/service/address/${id}`, data),

  downloadServiceOrderPDF: (id: string): Promise<AxiosResponse<Blob>> =>
    axiosInstance.get<Blob>(`/capture/service/pdf/${id}`, { responseType: 'blob' }),

  printServiceOrder: (data: ServiceOrderPrintRequest): Promise<AxiosResponse<void>> =>
    axiosInstance.post<void>('/capture/service/print', data),
}
