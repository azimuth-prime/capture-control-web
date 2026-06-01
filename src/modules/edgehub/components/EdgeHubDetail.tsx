import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { edgehubService } from '../services/edgehubService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'
import type { EdgeHubTag, ScanJob } from '../types'

// ── Toast ──────────────────────────────────────────────────────────────────
let toastCounter = 0

function useToast() {
  const [toasts, setToasts] = useState<
    { id: number; message: string; success: boolean }[]
  >([])

  function addToast(message: string, success: boolean) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, success }])
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000
    )
  }

  return { toasts, addToast }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return '—'
  return iso.substring(0, 19).replace('T', ' ')
}

function ScanJobBadge({ status }: { status: string }) {
  const cls =
    status === 'INPROGRESS'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'COMPLETE'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────
export function EdgeHubDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  // Hub name edit state
  const [editName, setEditName] = useState('')
  const [editWarehouseId, setEditWarehouseId] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Tag search
  const [keyword, setKeyword] = useState('')
  const [tagPage, setTagPage] = useState(0)
  const debouncedKeyword = useDebounce(keyword, 300)

  // Tag detail modal
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [tagModalOpen, setTagModalOpen] = useState(false)

  // ── Queries ──────────────────────────────────────────────────────────────

  const hubQuery = useQuery({
    queryKey: ['edgehub', id],
    queryFn: () => edgehubService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const statsQuery = useQuery({
    queryKey: ['edgehub', id, 'stats'],
    queryFn: () => edgehubService.getHubStats(id!).then((r) => r.data),
    enabled: !!id,
  })

  /**
   * Poll every 3 s while a scan job is INPROGRESS.
   * Backend returns `{}` when no job is running — guard on `.id` presence.
   */
  const runningJobQuery = useQuery({
    queryKey: ['edgehub', id, 'scanjob', 'running'],
    queryFn: () => edgehubService.findRunningScanJobs(id!).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'INPROGRESS' ? 3000 : false,
  })

  const jobHistoryQuery = useQuery({
    queryKey: ['edgehub', id, 'jobs'],
    queryFn: () => edgehubService.findLast20ScanJobs(id!).then((r) => r.data),
    enabled: !!id,
  })

  const tagSearchQuery = useQuery({
    queryKey: ['edgehub', id, 'tags', debouncedKeyword, tagPage],
    queryFn: () =>
      edgehubService
        .findTagsByKeyword(
          { keyword: debouncedKeyword, page: tagPage, resultsPerPage: 20 },
          id!
        )
        .then((r) => r.data),
    enabled: !!id && debouncedKeyword.length > 0,
  })

  const tagDetailQuery = useQuery({
    queryKey: ['edgehub', id, 'tag', selectedTagId],
    queryFn: () =>
      edgehubService.findTagById(id!, selectedTagId!).then((r) => r.data),
    enabled: !!id && !!selectedTagId && tagModalOpen,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────

  const scanMutation = useMutation<
    ScanJob,
    { response?: { data?: ApiError } }
  >({
    mutationFn: () => edgehubService.scanEdgehub(id!).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['edgehub', id, 'scanjob', 'running'],
      })
      queryClient.invalidateQueries({ queryKey: ['edgehub', id, 'jobs'] })
      addToast('Scan started.', true)
    },
    onError: (err) =>
      addToast(
        err.response?.data?.errorMessage ?? 'Failed to start scan.',
        false
      ),
  })

  const saveMutation = useMutation<
    unknown,
    { response?: { data?: ApiError } },
    { name: string; warehouseId: string }
  >({
    mutationFn: ({ name, warehouseId }) =>
      edgehubService
        .save({ id, name, physicalWarehouse: { id: warehouseId } })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edgehub', id] })
      setEditModalOpen(false)
      addToast('Hub saved.', true)
    },
    onError: (err) =>
      addToast(
        err.response?.data?.errorMessage ?? 'Failed to save hub.',
        false
      ),
  })

  const reprintMutation = useMutation<
    void,
    { response?: { data?: ApiError } },
    { tagId: string }
  >({
    mutationFn: ({ tagId }) =>
      edgehubService.printRFIDTag(tagId, id!).then((r) => r.data),
    onSuccess: () => addToast('Reprint sent to printer.', true),
    onError: (err) =>
      addToast(
        err.response?.data?.errorMessage ?? 'Reprint failed.',
        false
      ),
  })

  // ── Derived state ────────────────────────────────────────────────────────
  const hub = hubQuery.data
  const runningJob = runningJobQuery.data
  const activeJob: Partial<ScanJob> | undefined =
    runningJob && runningJob.id ? runningJob : undefined

  // ── Open edit modal ──────────────────────────────────────────────────────
  function openEditModal() {
    setEditName(hub?.name ?? '')
    setEditWarehouseId(hub?.physicalWarehouse?.id ?? '')
    setEditModalOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate({ name: editName.trim(), warehouseId: editWarehouseId })
  }

  // ── Open tag modal ───────────────────────────────────────────────────────
  function openTagModal(tag: EdgeHubTag) {
    setSelectedTagId(tag.id)
    setTagModalOpen(true)
  }

  function closeTagModal() {
    setTagModalOpen(false)
    setSelectedTagId(null)
  }

  // ── Keyword change resets page ────────────────────────────────────────────
  function handleKeywordChange(value: string) {
    setKeyword(value)
    setTagPage(0)
  }

  // ── Loading / error states for the primary hub query ─────────────────────
  if (hubQuery.isLoading) return <LoadingSpinner message="Loading edge hub..." />
  if (hubQuery.isError)
    return (
      <ErrorMessage
        title="Failed to load edge hub"
        message={(hubQuery.error as Error).message}
        onRetry={hubQuery.refetch}
      />
    )
  if (!hub) return null

  return (
    <div className="container-fluid px-4 py-2">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/edgehubs" className="hover:underline">
              Edge Hubs
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-foreground">{hub.name}</li>
        </ol>
      </nav>

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="mb-4 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-md p-3 text-sm ${
                t.success
                  ? 'border border-green-300 bg-green-50 text-green-800'
                  : 'border border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{hub.name}</h1>
          <p className="text-sm text-muted-foreground">
            {hub.physicalWarehouse?.name}
            {hub.serialNumber && ` · S/N: ${hub.serialNumber}`}
            {hub.model && ` · ${hub.model}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => scanMutation.mutate()}
            disabled={
              scanMutation.isPending || activeJob?.status === 'INPROGRESS'
            }
            className="rounded border border-indigo-600 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
          >
            {scanMutation.isPending ? 'Starting...' : 'Scan EdgeHub'}
          </button>
          <button
            onClick={openEditModal}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Edit Hub
          </button>
        </div>
      </div>

      {/* ── Active scan job banner ── */}
      {runningJobQuery.isLoading ? (
        <div className="mb-4 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          Checking for active scan...
        </div>
      ) : activeJob ? (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <div className="flex items-center gap-3">
            <span className="animate-pulse text-yellow-600">&#9679;</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Scan in progress &mdash; Job #{activeJob.id}
              </p>
              <p className="text-xs text-yellow-700">
                Started: {formatDate(activeJob.startTime)} &middot; Polling
                every 3 s
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          No active scan job.
        </div>
      )}

      {/* ── Info grid ── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hub details */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Hub Details</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{hub.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Serial Number</dt>
              <dd>{hub.serialNumber ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Model</dt>
              <dd>{hub.model ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {hub.status ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      hub.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {hub.status}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd>{hub.physicalWarehouse?.name ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Stats */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Hub Stats</h2>
          {statsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading stats...</p>
          )}
          {statsQuery.isError && (
            <p className="text-sm text-destructive">Failed to load stats.</p>
          )}
          {statsQuery.data && (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Tags</dt>
                <dd>{statsQuery.data.totalTags ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Scan</dt>
                <dd>{formatDate(statsQuery.data.lastScanDate as string | undefined)}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Running job summary */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Current Job</h2>
          {activeJob ? (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Job ID</dt>
                <dd className="font-mono text-xs">{activeJob.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <ScanJobBadge status={activeJob.status!} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Started</dt>
                <dd>{formatDate(activeJob.startTime)}</dd>
              </div>
              {activeJob.itemCount !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Items Found</dt>
                  <dd>{activeJob.itemCount}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No active scan job.</p>
          )}
        </div>
      </div>

      {/* ── Tag search ── */}
      <div className="mb-4 rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-semibold">Tag Search</h2>
        <input
          type="text"
          placeholder="Search tags by keyword..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="mb-3 w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {tagSearchQuery.isLoading && debouncedKeyword.length > 0 && (
          <LoadingSpinner message="Searching tags..." />
        )}
        {tagSearchQuery.isError && (
          <ErrorMessage message="Failed to search tags." />
        )}

        {tagSearchQuery.data && (
          <>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-2">EPC</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Lot / Serial</th>
                    <th className="px-4 py-2">Last Found</th>
                  </tr>
                </thead>
                <tbody>
                  {tagSearchQuery.data.results.map((tag) => (
                    <tr
                      key={tag.id}
                      onClick={() => openTagModal(tag)}
                      className="cursor-pointer border-b hover:bg-muted/40"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{tag.epc}</td>
                      <td className="px-4 py-2">{tag.productName ?? '—'}</td>
                      <td className="px-4 py-2">{tag.lotSerial ?? '—'}</td>
                      <td className="px-4 py-2">{formatDate(tag.lastFoundDate)}</td>
                    </tr>
                  ))}
                  {tagSearchQuery.data.results.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No tags found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tagSearchQuery.data.totalResults} tag
                {tagSearchQuery.data.totalResults !== 1 ? 's' : ''}
              </p>
              <Pagination
                page={tagSearchQuery.data.page}
                pages={Math.min(tagSearchQuery.data.pages, 30)}
                hasNext={tagSearchQuery.data.hasNext}
                hasPrevious={tagSearchQuery.data.hasPrevious}
                onPageChange={setTagPage}
              />
            </div>
          </>
        )}

        {debouncedKeyword.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Enter a keyword to search tags.
          </p>
        )}
      </div>

      {/* ── Scan job history ── */}
      <div className="mb-4 rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-semibold">Scan History (last 20)</h2>
        {jobHistoryQuery.isLoading && (
          <LoadingSpinner message="Loading scan history..." />
        )}
        {jobHistoryQuery.isError && (
          <ErrorMessage message="Failed to load scan history." />
        )}
        {jobHistoryQuery.data && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Job ID</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Start Time</th>
                  <th className="px-4 py-2">End Time</th>
                  <th className="px-4 py-2 text-right">Items</th>
                </tr>
              </thead>
              <tbody>
                {jobHistoryQuery.data.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono text-xs">{job.id}</td>
                    <td className="px-4 py-2">
                      <ScanJobBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2">{formatDate(job.startTime)}</td>
                    <td className="px-4 py-2">{formatDate(job.endTime)}</td>
                    <td className="px-4 py-2 text-right">
                      {job.itemCount ?? '—'}
                    </td>
                  </tr>
                ))}
                {jobHistoryQuery.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No scan history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT HUB MODAL ── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Hub</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-destructive hover:opacity-70"
              >
                ✕
              </button>
            </div>
            {saveMutation.isError && (
              <div className="mb-3 rounded border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                {(saveMutation.error as { response?: { data?: ApiError } })
                  .response?.data?.errorMessage ?? 'Save failed.'}
              </div>
            )}
            <form onSubmit={handleSave} noValidate>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Warehouse ID
                  </label>
                  <input
                    type="text"
                    value={editWarehouseId}
                    onChange={(e) => setEditWarehouseId(e.target.value)}
                    className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {hub.physicalWarehouse?.name}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAG DETAIL MODAL ── */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tag Details</h2>
              <button
                onClick={closeTagModal}
                className="text-destructive hover:opacity-70"
              >
                ✕
              </button>
            </div>

            {tagDetailQuery.isLoading && (
              <LoadingSpinner message="Loading tag..." />
            )}
            {tagDetailQuery.isError && (
              <ErrorMessage message="Failed to load tag details." />
            )}

            {tagDetailQuery.data && (
              <>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">EPC</dt>
                    <dd className="font-mono text-xs">
                      {tagDetailQuery.data.epc}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Product</dt>
                    <dd>{tagDetailQuery.data.productName ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Lot / Serial</dt>
                    <dd>{tagDetailQuery.data.lotSerial ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(tagDetailQuery.data.creationDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last Modified</dt>
                    <dd>{formatDate(tagDetailQuery.data.lastModifiedDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last Found</dt>
                    <dd>{formatDate(tagDetailQuery.data.lastFoundDate)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeTagModal}
                    className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      reprintMutation.mutate({
                        tagId: tagDetailQuery.data!.id,
                      })
                    }}
                    disabled={reprintMutation.isPending}
                    className="rounded border border-indigo-600 px-4 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
                  >
                    {reprintMutation.isPending
                      ? 'Reprinting...'
                      : 'Reprint Tag'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
