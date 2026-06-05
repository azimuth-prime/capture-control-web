import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../services/dashboardService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { WMSOrderRow } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend)

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function OrderTable({ rows, label, color }: { rows: WMSOrderRow[]; label: string; color: string }) {
  const total = rows.reduce((s, r) => s + (r.total ?? 0), 0)
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color }}>{label} ({rows.length})</h2>
        <span className="text-sm font-medium">${fmt(total)}</span>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Warehouse</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Ship By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/50">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to={`/order/${row.id}`} className="text-blue-600 hover:underline">{row.id}</Link>
                </td>
                <td className="px-3 py-2">{row.customerName ?? '—'}</td>
                <td className="px-3 py-2">{row.warehouseName ?? '—'}</td>
                <td className="px-3 py-2">{row.submittedDate?.slice(0, 10) ?? '—'}</td>
                <td className="px-3 py-2">{row.shipRequestDate?.slice(0, 10) ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function WarehouseDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['wms-orders'],
    queryFn: () => dashboardService.findWMSOrders().then((r) => r.data),
  })

  if (isLoading) return <div className="p-4"><LoadingSpinner /></div>
  if (isError) return (
    <div className="p-4">
      <ErrorMessage
        message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load warehouse data.'}
        onRetry={refetch}
      />
    </div>
  )

  const pickCount  = data?.ordersToPick.length  ?? 0
  const packCount  = data?.ordersToPack.length  ?? 0
  const shipCount  = data?.ordersToShip.length  ?? 0
  const pickTotal  = data?.ordersToPick.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const packTotal  = data?.ordersToPack.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const shipTotal  = data?.ordersToShip.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0

  const pipelineChartData = {
    labels: ['To Pick', 'To Pack', 'To Ship'],
    datasets: [{
      data: [pickCount, packCount, shipCount],
      backgroundColor: ['#dc2626', '#f97316', '#2563eb'],
    }],
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Warehouse Dashboard</h1>

      {/* Pipeline summary */}
      <section className="mb-6 rounded border p-4">
        <p className="mb-3 text-sm font-semibold">Fulfillment Pipeline</p>
        <div className="flex flex-wrap items-center gap-8">
          <div className="h-56 w-56 shrink-0">
            <Doughnut data={pipelineChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[
              { label: 'To Pick',  count: pickCount,  total: pickTotal,  color: '#dc2626' },
              { label: 'To Pack',  count: packCount,  total: packTotal,  color: '#f97316' },
              { label: 'To Ship',  count: shipCount,  total: shipTotal,  color: '#2563eb' },
              { label: 'Total',    count: pickCount + packCount + shipCount, total: pickTotal + packTotal + shipTotal, color: undefined },
            ].map((s) => (
              <div key={s.label} className="rounded border p-3">
                <p className="text-xs font-semibold" style={s.color ? { color: s.color } : undefined}>{s.label}</p>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">${fmt(s.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data && (
        <>
          <OrderTable rows={data.ordersToPick} label="To Pick" color="#dc2626" />
          <OrderTable rows={data.ordersToPack} label="To Pack" color="#f97316" />
          <OrderTable rows={data.ordersToShip} label="To Ship" color="#2563eb" />
        </>
      )}
    </div>
  )
}
