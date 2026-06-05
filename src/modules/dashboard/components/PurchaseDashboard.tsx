import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

function fmtDays(n: number | undefined) {
  if (n == null) return '—'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} days`
}

export function PurchaseDashboard() {
  const approval    = useQuery({ queryKey: ['po-approval'],   queryFn: () => dashboardService.findPOAwaitingApproval().then((r) => r.data) })
  const receipt     = useQuery({ queryKey: ['po-receipt'],    queryFn: () => dashboardService.findPOAwaitingReceipt().then((r) => r.data) })
  const backordered = useQuery({ queryKey: ['backordered'],   queryFn: () => dashboardService.findBackorderedItems().then((r) => r.data) })
  const cycle30     = useQuery({ queryKey: ['cycle-30'],      queryFn: () => dashboardService.findAvgPurchaseCycleLast30().then((r) => r.data) })
  const cycleYear   = useQuery({ queryKey: ['cycle-year'],    queryFn: () => dashboardService.findAvgPurchaseCycleLastYear().then((r) => r.data) })

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Purchase Orders Dashboard</h1>

      {/* Avg Purchase Cycle */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Average Purchase Lifecycle</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Last 30 Days</p>
            {cycle30.isLoading ? <LoadingSpinner /> : <p className="mt-1 text-2xl font-bold">{fmtDays(cycle30.data)}</p>}
          </div>
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Last Year</p>
            {cycleYear.isLoading ? <LoadingSpinner /> : <p className="mt-1 text-2xl font-bold">{fmtDays(cycleYear.data)}</p>}
          </div>
        </div>
      </section>

      {/* Awaiting Approval */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Waiting for Approval {approval.data ? `(${approval.data.length})` : ''}
        </h2>
        {approval.isLoading && <LoadingSpinner />}
        {approval.isError && (
          <ErrorMessage
            message={(approval.error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load.'}
            onRetry={approval.refetch}
          />
        )}
        {approval.data && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">PO ID</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {approval.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/purchase/${row.id}`} className="text-blue-600 hover:underline">{row.id}</Link>
                    </td>
                    <td className="px-3 py-2">{row.vendor?.name ?? '—'}</td>
                    <td className="px-3 py-2">{row.warehouse?.name ?? '—'}</td>
                    <td className="px-3 py-2">{(row.creationDate ?? row.issueDate)?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.createdBy ?? '—'}</td>
                  </tr>
                ))}
                {approval.data.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No orders awaiting approval.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Awaiting Receipt */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Waiting for Receipt {receipt.data ? `(${receipt.data.length})` : ''}
        </h2>
        {receipt.isLoading && <LoadingSpinner />}
        {receipt.isError && (
          <ErrorMessage
            message={(receipt.error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load.'}
            onRetry={receipt.refetch}
          />
        )}
        {receipt.data && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">PO ID</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Issue Date</th>
                  <th className="px-3 py-2">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receipt.data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/purchase/${row.id}`} className="text-blue-600 hover:underline">{row.id}</Link>
                    </td>
                    <td className="px-3 py-2">{row.vendor?.name ?? '—'}</td>
                    <td className="px-3 py-2">{row.warehouse?.name ?? '—'}</td>
                    <td className="px-3 py-2">{(row.issueDate ?? row.creationDate)?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.createdBy ?? '—'}</td>
                  </tr>
                ))}
                {receipt.data.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No orders awaiting receipt.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Backordered Stock */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Backordered Stock {backordered.data ? `(${backordered.data.length})` : ''}
        </h2>
        {backordered.isLoading && <LoadingSpinner />}
        {backordered.isError && (
          <ErrorMessage
            message={(backordered.error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load.'}
            onRetry={backordered.refetch}
          />
        )}
        {backordered.data && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">SKU ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2 text-right">Back Ordered</th>
                  <th className="px-3 py-2 text-right">Qty on PO</th>
                  <th className="px-3 py-2">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {backordered.data.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.skuId ? (
                        <Link to={`/products/skus/${row.skuId}`} className="text-blue-600 hover:underline">{row.skuId}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2">{row.name ?? '—'}</td>
                    <td className="px-3 py-2">{row.vendor?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{row.qtyBackOrdered?.toLocaleString() ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{row.qtyOnPO?.toLocaleString() ?? '—'}</td>
                    <td className="px-3 py-2">{row.backOrderedSince?.slice(0, 10) ?? '—'}</td>
                  </tr>
                ))}
                {backordered.data.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No backordered items.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
