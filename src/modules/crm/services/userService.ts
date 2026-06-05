import axiosInstance from '../../../auth/axiosInstance'
import type { User, UserSearchRequest, UserSummary, Role, Warehouse, ResetPasswordRequest } from '../types'
import type { PagedResult } from '../../../shared/types'

export const userService = {
  search: (data: UserSearchRequest) =>
    axiosInstance.post<PagedResult<UserSummary>>('/capture/user/search', data),

  findById: (id: string) =>
    axiosInstance.get<User>(`/capture/user/${id}`),

  getCurrentUser: () =>
    axiosInstance.get<User>('/capture/user/current'),

  saveUser: (data: Partial<User>) =>
    axiosInstance.post<User>('/capture/user', data),

  findAllRoles: () =>
    axiosInstance.get<Role[]>('/capture/user/roles'),

  findAllWarehouses: () =>
    axiosInstance.get<Warehouse[]>('/capture/warehouse/physical'),

  findSalesUsers: () =>
    axiosInstance.get<UserSummary[]>('/capture/user/sales'),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosInstance.post<void>('/capture/user/resetpassword', data),
}
