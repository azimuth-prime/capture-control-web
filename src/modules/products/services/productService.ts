import axiosInstance from '../../../auth/axiosInstance'
import type {
  Product,
  ProductSummary,
  ProductSearchRequest,
  StockUnit,
} from '../types'
import type { PagedResult } from '../../../shared/types'

export const productService = {
  findById: (id: string) =>
    axiosInstance.get<Product>(`/capture/product/${id}`),

  findAll: () =>
    axiosInstance.get<Product[]>('/capture/product'),

  findByKeyword: (data: ProductSearchRequest) =>
    axiosInstance.post<PagedResult<ProductSummary>>('/capture/product/search', data),

  findSkusByProductId: (id: string) =>
    axiosInstance.get<Product>(`/capture/product/skus/${id}`),

  save: (data: Partial<Product>) =>
    axiosInstance.post<Product>('/capture/product', data),

  saveStockUnit: (data: Partial<StockUnit>) =>
    axiosInstance.post<StockUnit>('/capture/product/config/stockunit', data),

  findStockUnitById: (id: string) =>
    axiosInstance.get<StockUnit>(`/capture/product/config/stockunit/${id}`),

  deleteStockUnit: (id: string) =>
    axiosInstance.delete<void>(`/capture/product/config/stockunit/${id}`),
}
