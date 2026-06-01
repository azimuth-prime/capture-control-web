import type { AxiosResponse } from 'axios'
import axiosInstance from '../../../auth/axiosInstance'
import type { PagedResult } from '../../../shared/types'
import type {
  EdgeHub,
  EdgeHubSummary,
  EdgeHubStats,
  EdgeHubTag,
  EdgeHubSaveRequest,
  ScanJob,
  TagKeywordRequest,
} from '../types'

export const edgehubService = {
  findById: (id: string): Promise<AxiosResponse<EdgeHub>> =>
    axiosInstance.get<EdgeHub>(`/capture/edgehub/${id}`),

  findAll: (): Promise<AxiosResponse<EdgeHubSummary[]>> =>
    axiosInstance.get<EdgeHubSummary[]>('/capture/edgehub'),

  save: (data: EdgeHubSaveRequest): Promise<AxiosResponse<EdgeHub>> =>
    axiosInstance.post<EdgeHub>('/capture/edgehub', data),

  getHubStats: (id: string): Promise<AxiosResponse<EdgeHubStats>> =>
    axiosInstance.get<EdgeHubStats>(`/capture/edgehub/stats/${id}`),

  findTagById: (edgehubId: string, tagId: string): Promise<AxiosResponse<EdgeHubTag>> =>
    axiosInstance.get<EdgeHubTag>(`/capture/edgehub/tag/${edgehubId}/${tagId}`),

  findTagsByInventoryId: (id: string): Promise<AxiosResponse<EdgeHubTag[]>> =>
    axiosInstance.get<EdgeHubTag[]>(`/capture/edgehub/inventory/${id}`),

  findTagsByKeyword: (
    data: TagKeywordRequest,
    id: string
  ): Promise<AxiosResponse<PagedResult<EdgeHubTag>>> =>
    axiosInstance.post<PagedResult<EdgeHubTag>>(
      `/capture/edgehub/tag/keyword/${id}`,
      data
    ),

  /** jobId is the scan-job id; takes two separate string args */
  findScanJobById: (
    edgehubId: string,
    jobId: string
  ): Promise<AxiosResponse<ScanJob>> =>
    axiosInstance.get<ScanJob>(`/capture/edgehub/scanjob/${edgehubId}/${jobId}`),

  findLast20ScanJobs: (id: string): Promise<AxiosResponse<ScanJob[]>> =>
    axiosInstance.get<ScanJob[]>(`/capture/edgehub/scanjob/history/${id}`),

  /**
   * Returns the currently running scan job, or an empty object `{}` when no
   * job is in progress. Typed as `Partial<ScanJob>` to reflect the backend
   * contract — callers must guard on the presence of `.id`.
   */
  findRunningScanJobs: (id: string): Promise<AxiosResponse<Partial<ScanJob>>> =>
    axiosInstance.get<Partial<ScanJob>>(`/capture/edgehub/scanjob/${id}`),

  /** Triggers a full scan and returns the newly created ScanJob */
  scanEdgehub: (id: string): Promise<AxiosResponse<ScanJob>> =>
    axiosInstance.get<ScanJob>(`/capture/edgehub/scanjob/fullscan/${id}`),

  printRFIDTag: (tagId: string, edgehubId: string): Promise<AxiosResponse<void>> =>
    axiosInstance.get<void>(`/capture/edgehub/printtag/${tagId}/${edgehubId}`),
}
