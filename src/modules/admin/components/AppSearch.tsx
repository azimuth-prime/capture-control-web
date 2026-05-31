import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { solrService } from '../services/solrService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import type { IndexJobWithElapsed } from '../types'
import type { ApiError } from '../../../shared/types'
import { useState } from 'react'

function enrichWithElapsed(job: import('../types').IndexJob): IndexJobWithElapsed {
  const end = job.endDate ? new Date(job.endDate).getTime() : Date.now()
  const start = new Date(job.startDate).getTime()
  return { ...job, elapsedTime: (end - start) / 1000 }
}

export function AppSearch() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [historyPage, setHistoryPage] = useState(0)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  // Active job polling — refetchInterval stops when no job is processing
  const activityQuery = useQuery({
    queryKey: ['admin', 'solr', 'activity'],
    queryFn: () => solrService.isExisting().then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.id && query.state.data?.state === 'PROCESSING' ? 2000 : false,
  })

  const activeJob = activityQuery.data?.id ? activityQuery.data : null

  // History list — refetched when a job completes (no longer processing)
  const historyQuery = useQuery({
    queryKey: ['admin', 'solr', 'history', historyPage],
    queryFn: () =>
      solrService.findAllIndexes({ page: historyPage, resultsPerPage: 20 }).then((r) => ({
        ...r.data,
        results: r.data.results.map(enrichWithElapsed),
      })),
  })

  // When activity polling stops (job done), refresh history
  const prevProcessing = activityQuery.data?.state === 'PROCESSING'
  if (!prevProcessing && activeJob === null) {
    // noop — TanStack Query will handle stale invalidation via mutation callbacks
  }

  // --- Mutations ---
  const startIndexMutation = useMutation<import('../types').IndexJob, { response?: { data?: ApiError } }>({
    mutationFn: () => solrService.startIndex().then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'solr', 'activity'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'solr', 'history'] })
      showToast('Full indexing started.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Failed to start index.', false),
  })

  const startIncrementalMutation = useMutation<import('../types').IndexJob, { response?: { data?: ApiError } }>({
    mutationFn: () => solrService.startIncrementalIndex().then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'solr', 'activity'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'solr', 'history'] })
      showToast('Incremental indexing started.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Failed to start incremental index.', false),
  })

  const clearJobsMutation = useMutation({
    mutationFn: () => solrService.clearOldIndexJobs().then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'solr', 'history'] })
      showToast('Old search indexes cleared.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Clear failed.', false),
  })

  const isRunning = !!activeJob
  const canStart = !isRunning && !startIndexMutation.isPending && !startIncrementalMutation.isPending

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Search Index</li>
        </ol>
      </nav>

      {toast && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            toast.success
              ? 'border border-green-300 bg-green-50 text-green-800'
              : 'border border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Active job panel */}
      <div className="mb-6 rounded-lg border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Search Index Management</h2>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => startIndexMutation.mutate()}
              disabled={!canStart}
              className="rounded border border-blue-600 px-3 py-1 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            >
              Full Index
            </button>
            <button
              onClick={() => startIncrementalMutation.mutate()}
              disabled={!canStart}
              className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-40"
            >
              Incremental Index
            </button>
            <button
              onClick={() => clearJobsMutation.mutate()}
              disabled={isRunning || clearJobsMutation.isPending}
              className="rounded border border-destructive px-3 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Clear Old Indexes
            </button>
          </div>
        </div>

        {activityQuery.isLoading && <LoadingSpinner message="Checking index status..." />}
        {activityQuery.isError && (
          <ErrorMessage message={(activityQuery.error as Error).message} onRetry={activityQuery.refetch} />
        )}

        {activeJob && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {activeJob.jobType} Index Running
              </span>
              <span className="ml-auto text-xs text-blue-600">{activeJob.state}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 sm:grid-cols-4">
              <div>Products: {activeJob.productsIndexed} / {activeJob.totalProducts}</div>
              <div>SKUs: {activeJob.skusIndexed} / {activeJob.totalSkus}</div>
              <div>Orgs: {activeJob.orgsIndexed} / {activeJob.totalOrgs}</div>
              <div>Orders: {activeJob.sosIndexed} / {activeJob.totalSos}</div>
            </div>
          </div>
        )}

        {!activityQuery.isLoading && !activeJob && (
          <p className="text-sm text-muted-foreground">No indexing job is currently running.</p>
        )}
      </div>

      {/* Index history */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Index History</h2>
        {historyQuery.isLoading && <LoadingSpinner message="Loading history..." />}
        {historyQuery.isError && (
          <ErrorMessage message={(historyQuery.error as Error).message} onRetry={historyQuery.refetch} />
        )}
        {historyQuery.data && (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Elapsed (s)</th>
                  <th className="py-2 pr-4">Items</th>
                </tr>
              </thead>
              <tbody>
                {historyQuery.data.results.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/40">
                    <td className="py-2 pr-4">{job.jobType}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          job.state === 'COMPLETE'
                            ? 'bg-green-100 text-green-800'
                            : job.state === 'ERROR'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {job.state}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{job.startDate.substring(0, 19).replace('T', ' ')}</td>
                    <td className="py-2 pr-4">{job.elapsedTime.toFixed(1)}</td>
                    <td className="py-2 pr-4">{job.currentItem} / {job.totalItems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <Pagination
                page={historyQuery.data.page}
                pages={historyQuery.data.pages}
                hasNext={historyQuery.data.hasNext}
                hasPrevious={historyQuery.data.hasPrevious}
                onPageChange={setHistoryPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
