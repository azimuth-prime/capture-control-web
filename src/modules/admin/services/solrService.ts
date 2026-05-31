import axiosInstance from '../../../auth/axiosInstance'
import type { IndexJob, IndexSearchRequest } from '../types'
import type { PagedResult } from '../../../shared/types'

export const solrService = {
  findById: (id: string) =>
    axiosInstance.get<IndexJob>(`/capture/solr/index/${id}`),

  findAllIndexes: (data: IndexSearchRequest) =>
    axiosInstance.post<PagedResult<IndexJob>>('/capture/solr/index', data),

  // endpoint returns a job count or similar payload; exact type TBD from API docs
  clearOldIndexJobs: () =>
    axiosInstance.get<unknown>('/capture/solr/index/clear'),

  isExisting: () =>
    axiosInstance.get<IndexJob>('/capture/solr/index/activity'),

  startIndex: () =>
    axiosInstance.get<IndexJob>('/capture/solr/index/start'),

  startIncrementalIndex: () =>
    axiosInstance.get<IndexJob>('/capture/solr/index/start/incremental'),
}
