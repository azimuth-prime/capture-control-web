import axiosInstance from '../../../auth/axiosInstance'
import type { PagedResult } from '../../../shared/types'
import type {
  Invoice,
  InvoiceListItem,
  InvoiceSearchRequest,
  ReceivePaymentRequest,
  PrintRequest,
  SendEmailRequest,
} from '../types'

export async function findInvoiceByKeyword(
  request: InvoiceSearchRequest
): Promise<PagedResult<InvoiceListItem>> {
  const { data } = await axiosInstance.post<PagedResult<InvoiceListItem>>(
    '/capture/invoice/search',
    request
  )
  return data
}

export async function findInvoiceById(id: string): Promise<Invoice> {
  const { data } = await axiosInstance.get<Invoice>(`/capture/invoice/${id}`)
  return data
}

export async function findInvoicesByCustomerId(
  request: InvoiceSearchRequest
): Promise<PagedResult<InvoiceListItem>> {
  const { data } = await axiosInstance.post<PagedResult<InvoiceListItem>>(
    '/capture/invoice/customer/search',
    request
  )
  return data
}

export async function findInvoicesByOrderId(orderId: string): Promise<Invoice[]> {
  const { data } = await axiosInstance.get<Invoice[]>(`/capture/invoice/order/${orderId}`)
  return data
}

export async function receivePayment(request: ReceivePaymentRequest): Promise<Invoice> {
  const { data } = await axiosInstance.post<Invoice>('/capture/invoice/payment', request)
  return data
}

export async function printInvoice(request: PrintRequest): Promise<void> {
  await axiosInstance.post('/capture/invoice/print', request)
}

export async function printCommercialInvoice(request: PrintRequest): Promise<void> {
  await axiosInstance.post('/capture/invoice/print/commercial', request)
}

export async function downloadInvoicePDF(id: string): Promise<Blob> {
  const { data } = await axiosInstance.get<Blob>(`/capture/invoice/pdf/${id}`, {
    responseType: 'blob',
  })
  return data
}

export async function downloadCommercialInvoicePDF(id: string): Promise<Blob> {
  const { data } = await axiosInstance.get<Blob>(`/capture/invoice/pdf/commercial/${id}`, {
    responseType: 'blob',
  })
  return data
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const { data } = await axiosInstance.delete<Invoice>(`/capture/invoice/${id}`)
  return data
}

export async function sendInvoiceEmail(request: SendEmailRequest): Promise<void> {
  await axiosInstance.post('/capture/invoice/email', request)
}
