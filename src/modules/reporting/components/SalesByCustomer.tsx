import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { salesReportService } from '../services/salesReportService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { DateRangeRequest } from '../types'

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export function SalesByCustomer() {
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filter, setFilter] = useState<DateRangeRequest | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['sales-by-customer', filter],
    queryFn: () => salesReportService.findOrdersByCustomer(filter!).then((r) => r.data),
    enabled: filter !== null,
  })

  function toggleExpand(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const grandTotal = data?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Sales by Customer</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Sales by Customer</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => { setFilter({ fromDate, toDate }); setExpanded(new Set()) }}
          disabled={isFetching}
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isFetching ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {isFetching && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load report.'}
          onRetry={refetch}
        />
      )}

      {data && !isFetching && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.length} customers &mdash; Total: ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <th className="w-6 px-3 py-2" />
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((row, idx) => (
                  <>
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="px-3 py-2">
                        {row.orders && row.orders.length > 0 && (
                          <button
                            onClick={() => toggleExpand(idx)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expanded.has(idx) ? '▾' : '▸'}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {row.customerId ? (
                          <Link to={`/crm/organizations/${row.customerId}`} className="text-blue-600 hover:underline">
                            {row.customerName ?? row.customerId}
                          </Link>
                        ) : (row.customerName ?? '—')}
                      </td>
                      <td className="px-3 py-2 text-right">{row.orderCount ?? 0}</td>
                      <td className="px-3 py-2 text-right">
                        ${(row.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {expanded.has(idx) && row.orders?.map((o) => (
                      <tr key={o.orderId} className="bg-muted/30 text-xs">
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5 font-mono">
                          <Link to={`/orders/${o.orderId}`} className="text-blue-600 hover:underline">
                            {o.orderId}
                          </Link>
                        </td>
                        <td className="px-3 py-1.5">{o.date?.slice(0, 10) ?? '—'}</td>
                        <td className="px-3 py-1.5 text-right">
                          ${o.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No results.
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
