import axiosInstance from '../../../auth/axiosInstance'

export const importService = {
  importProducts: (data: Record<string, unknown>[]) =>
    axiosInstance.post<{ imported: number; errors: string[] }>('/capture/product/import', data),

  importSkus: (data: Record<string, unknown>[]) =>
    axiosInstance.post<{ imported: number; errors: string[] }>('/capture/sku/import', data),

  importInventory: (data: Record<string, unknown>[]) =>
    axiosInstance.post<{ imported: number; errors: string[] }>('/capture/inventory/import', data),
}
