import type { AxiosResponse } from 'axios'
import axiosInstance from '../../../auth/axiosInstance'
import type { RMA, RMAItem, RMAItemReason, RMASaveItemsRequest } from '../types'

export const rmaService = {
  findById: (id: string): Promise<AxiosResponse<RMA>> =>
    axiosInstance.get<RMA>(`/capture/rma/${id}`),

  generateRMAItems: (id: string): Promise<AxiosResponse<RMA>> =>
    axiosInstance.get<RMA>(`/capture/rma/new/${id}`),

  findAll: (): Promise<AxiosResponse<RMA[]>> =>
    axiosInstance.get<RMA[]>('/capture/rma'),

  findAllReasons: (): Promise<AxiosResponse<RMAItemReason[]>> =>
    axiosInstance.get<RMAItemReason[]>('/capture/rma/reasons'),

  save: (data: Partial<RMA>): Promise<AxiosResponse<RMA>> =>
    axiosInstance.post<RMA>('/capture/rma', data),

  saveItemsToRMA: (data: RMASaveItemsRequest): Promise<AxiosResponse<RMAItem[]>> =>
    axiosInstance.post<RMAItem[]>('/capture/rma/items', data),
}
