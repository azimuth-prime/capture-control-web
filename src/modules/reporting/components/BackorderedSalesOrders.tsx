import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { salesReportService } from '../services/salesReportService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export function BackorderedSalesOrders() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['backordered-orders'],
    queryFn: () => salesReportService.findBackorderedOrders().then((r) => r.data),
  })

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Backordered Sales Orders</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Backordered Sales Orders</h1>

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load report.'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.length.toLocaleString()} results
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
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">SKU ID</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((row) => (
                  <tr key={row.orderId} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/orders/${row.orderId}`} className="text-blue-600 hover:underline">
                        {row.orderId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.customerName ?? '—'}</td>
                    <td className="px-3 py-2">{row.dueDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.productName ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.skuId ? (
                        <Link to={`/products/skus/${row.skuId}`} className="text-blue-600 hover:underline">
                          {row.skuId}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">{row.quantity.toLocaleString()}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No backordered orders.
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
