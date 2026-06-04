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

export function SalesOrdersByDate() {
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [filter, setFilter] = useState<DateRangeRequest | null>(null)

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['sales-by-date', filter],
    queryFn: () => salesReportService.findOrdersByDates(filter!).then((r) => r.data),
    enabled: filter !== null,
  })

  const total = data?.reduce((sum, r) => sum + r.total, 0) ?? 0

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Sales Orders by Date</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Sales Orders by Date</h1>

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
          onClick={() => setFilter({ fromDate, toDate })}
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
              {data.length.toLocaleString()} orders &mdash; Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Lines</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">State</th>
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
                    <td className="px-3 py-2">{row.date?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{row.lineCount ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2">{row.state ?? '—'}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
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
