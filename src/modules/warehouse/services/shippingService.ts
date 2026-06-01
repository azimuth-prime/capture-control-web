import axiosInstance from '../../../auth/axiosInstance'
import type {
  Carrier,
  ShipOrderRequest,
  ShippablePagedResult,
  WarehouseSearchRequest,
} from '../types'

export const shippingService = {
  findAllCarriers: () =>
    axiosInstance.get<Carrier[]>('/capture/carrier'),

  findCarrierById: (id: string) =>
    axiosInstance.get<Carrier>(`/capture/carrier/${id}`),

  findShippableOrderBykeyword: (data: WarehouseSearchRequest) =>
    axiosInstance.post<ShippablePagedResult>('/capture/shipping/search', data),

  shipOrder: (data: ShipOrderRequest) =>
    axiosInstance.post<void>('/capture/shipping', data),
}
