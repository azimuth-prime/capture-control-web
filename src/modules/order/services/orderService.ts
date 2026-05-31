import axiosInstance from '../../../auth/axiosInstance'
import type {
  Order,
  OrderPagedResult,
  OrderSearchRequest,
  OrderStateChangeRequest,
  EmailRequest,
  PrintRequest,
} from '../types'

export const orderService = {
  async searchOrders(request: OrderSearchRequest): Promise<OrderPagedResult> {
    const { data } = await axiosInstance.post<OrderPagedResult>('/capture/order/search', request)
    return data
  },

  async getOrderById(id: string): Promise<Order> {
    const { data } = await axiosInstance.get<Order>(`/capture/order/${id}`)
    return data
  },

  async saveOrder(order: Partial<Order>): Promise<Order> {
    const { data } = await axiosInstance.post<Order>('/capture/order', order)
    return data
  },

  async changeOrderState(request: OrderStateChangeRequest): Promise<Order> {
    const { data } = await axiosInstance.post<Order>('/capture/order/state', request)
    return data
  },

  async bookOrder(id: string): Promise<Order> {
    // FIXME: backend endpoint should be POST; using POST with empty body until backend is updated
    const { data } = await axiosInstance.post<Order>(`/capture/order/bookorder/${id}`, {})
    return data
  },

  async printOrder(request: PrintRequest): Promise<void> {
    await axiosInstance.post('/capture/order/print', request)
  },

  async downloadOrderPDF(id: string): Promise<Blob> {
    const { data } = await axiosInstance.get<Blob>(`/capture/order/pdf/${id}`, {
      responseType: 'blob',
    })
    return data
  },

  async sendOrderEmail(emailData: EmailRequest): Promise<void> {
    await axiosInstance.post('/capture/order/email', emailData)
  },

  async generateInvoice(id: string): Promise<Order> {
    const { data } = await axiosInstance.get<Order>(`/capture/invoice/order/invoice/${id}`)
    return data
  },
}
