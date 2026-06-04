import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { inventoryReportService } from '../services/inventoryReportService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export function InventoryAuditDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => inventoryReportService.findAuditById(id!).then((r) => r.data),
    enabled: !!id,
  })

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <Link to="/reporting/inventory-audit" className="hover:underline">Inventory Audit</Link>
        <span>›</span>
        <span className="font-mono">{id}</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Audit Detail</h1>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load audit.'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 rounded border p-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Warehouse</p>
              <p className="font-medium">{data.warehouse?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">State</p>
              <p className="font-medium">{data.state}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium">{data.startDate?.slice(0, 10) ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium">{data.endDate?.slice(0, 10) ?? '—'}</p>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {(data.items?.length ?? 0).toLocaleString()} items
            </span>
            <button
              onClick={() => window.print()}
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Print
            </button>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">SKU ID</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Lot / Serial</th>
                  <th className="px-3 py-2 text-right">Expected</th>
                  <th className="px-3 py-2 text-right">Counted</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2">State</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {item.skuId ? (
                        <Link to={`/products/skus/${item.skuId}`} className="text-blue-600 hover:underline">
                          {item.skuId}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2">{item.productName ?? '—'}</td>
                    <td className="px-3 py-2">{item.lotSerial ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{item.expected.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{item.counted?.toLocaleString() ?? '—'}</td>
                    <td className={`px-3 py-2 text-right ${(item.variance ?? 0) !== 0 ? 'font-semibold text-destructive' : ''}`}>
                      {item.variance != null ? item.variance.toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">{item.state ?? '—'}</td>
                  </tr>
                ))}
                {(!data.items || data.items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
