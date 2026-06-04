import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryReportService } from '../services/inventoryReportService'
import { warehouseService } from '../../warehouse/services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'

export function InventoryAuditList() {
  const [page, setPage] = useState(0)
  const [showNew, setShowNew] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audits', page],
    queryFn: () =>
      inventoryReportService
        .findAllAudits({ keyword: '*', page, resultsPerPage: 30 })
        .then((r) => r.data),
  })

  const warehousesQuery = useQuery({
    queryKey: ['physical-warehouses'],
    queryFn: () => warehouseService.findAllPhysicalWarehouses().then((r) => r.data),
    enabled: showNew,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const wh = warehousesQuery.data?.find((w) => w.id === warehouseId)
      return inventoryReportService
        .saveAudit({ warehouse: { id: warehouseId, name: wh?.name ?? '' } })
        .then((r) => r.data)
    },
    onSuccess: (audit) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] })
      navigate(`/reporting/inventory-audit/${audit.id}`)
    },
  })

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Inventory Audit</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Inventory Audit</h1>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load audits.'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.totalResults.toLocaleString()} audits
            </span>
            <button
              onClick={() => setShowNew(true)}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              New Audit
            </button>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Audit ID</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Start Date</th>
                  <th className="px-3 py-2">End Date</th>
                  <th className="px-3 py-2">State</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.results.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/reporting/inventory-audit/${row.id}`} className="text-blue-600 hover:underline">
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.warehouse?.name ?? '—'}</td>
                    <td className="px-3 py-2">{row.startDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.endDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.state}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No audits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <Pagination
              page={page}
              pages={Math.min(data.pages, 20)}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New Inventory Audit</h2>
            <div className="mb-4 flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Warehouse</label>
              {warehousesQuery.isLoading ? (
                <LoadingSpinner />
              ) : (
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  <option value="">Select warehouse...</option>
                  {warehousesQuery.data?.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowNew(false); setWarehouseId('') }}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!warehouseId || createMutation.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
