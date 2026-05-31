import axiosInstance from '../../../auth/axiosInstance'
import type { Organization, OrgAddress, OrgContact, OrgSearchRequest, OrgSummary, CustomerStats } from '../types'
import type { PagedResult } from '../../../shared/types'
import type { InvoiceListItem } from '../../invoice/types'
import type { OrderSummary } from '../../order/types'

export const organizationService = {
  search: (data: OrgSearchRequest) =>
    axiosInstance.post<PagedResult<OrgSummary>>('/capture/organization/search', data),

  findById: (id: string) =>
    axiosInstance.get<Organization>(`/capture/organization/${id}`),

  save: (data: Partial<Organization>) =>
    axiosInstance.post<Organization>('/capture/organization', data),

  findCustomerStats: (id: string) =>
    axiosInstance.get<CustomerStats>(`/capture/order/customer/stats/${id}`),

  findInvoicesByCustomerId: (data: { customerId: string; page: number; resultsPerPage: number }) =>
    axiosInstance.post<PagedResult<InvoiceListItem>>('/capture/invoice/customer/search', data),

  findOrdersByCustomerId: (data: { customerId: string; page: number; resultsPerPage: number }) =>
    axiosInstance.post<PagedResult<OrderSummary>>('/capture/order/customer', data),

  saveBillToAddress: (orgId: string, data: OrgAddress) =>
    axiosInstance.post<Organization>(`/capture/organization/${orgId}/address/billto`, data),

  saveShipToAddress: (orgId: string, data: OrgAddress) =>
    axiosInstance.post<Organization>(`/capture/organization/${orgId}/address/shipto`, data),

  findAddressById: (orgId: string, addressId: string) =>
    axiosInstance.get<OrgAddress>(`/capture/organization/${orgId}/address/${addressId}`),

  deleteAddressById: (orgId: string, addressId: string) =>
    axiosInstance.delete<void>(`/capture/organization/${orgId}/address/${addressId}`),

  saveCreditInfo: (orgId: string, data: { creditLimit?: number; paymentTerms?: string }) =>
    axiosInstance.post<Organization>(`/capture/organization/${orgId}/credit`, data),

  saveNote: (orgId: string, data: { notes: string }) =>
    axiosInstance.post<Organization>(`/capture/organization/${orgId}/note`, data),

  saveContacts: (orgId: string, data: OrgContact[]) =>
    axiosInstance.post<Organization>(`/capture/organization/${orgId}/contacts`, data),
}
