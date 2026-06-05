import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { dashboardService } from '../services/dashboardService'
import { useAuth } from '../../../auth/useAuth'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const PRIMARY = 'rgba(0, 76, 153, 0.85)'
const PRIMARY_LIGHT = 'rgba(204, 229, 255, 0.85)'

const barOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true as const },
  },
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function MainDashboard() {
  const [period, setPeriod] = useState<'30d' | 'year'>('30d')
  const [sellersPeriod, setSellersPeriod] = useState<'30d' | 'year'>('30d')
  const hasRole = useAuth((s) => s.hasRole)
  const isAdmin = hasRole('ADMIN')

  const ordersDay   = useQuery({ queryKey: ['orders-day'],   queryFn: () => dashboardService.findOrdersByDay().then((r) => r.data) })
  const ordersMonth = useQuery({ queryKey: ['orders-month'], queryFn: () => dashboardService.findOrdersByMonth().then((r) => r.data) })
  const revenueDay   = useQuery({ queryKey: ['revenue-day'],   queryFn: () => dashboardService.findRevenueByDay().then((r) => r.data) })
  const revenueMonth = useQuery({ queryKey: ['revenue-month'], queryFn: () => dashboardService.findRevenueByMonth().then((r) => r.data) })
  const sellers30   = useQuery({ queryKey: ['sellers-30'],   queryFn: () => dashboardService.findTopSellersLast30Days().then((r) => r.data) })
  const sellersYear = useQuery({ queryKey: ['sellers-year'], queryFn: () => dashboardService.findTopSellersLastYear().then((r) => r.data) })
  const wmsOrders   = useQuery({ queryKey: ['wms-orders'],   queryFn: () => dashboardService.findWMSOrders().then((r) => r.data) })

  const pl30   = useQuery({ queryKey: ['pl-30'],   queryFn: () => dashboardService.findPLLast30Days().then((r) => r.data), enabled: isAdmin })
  const plYear = useQuery({ queryKey: ['pl-year'], queryFn: () => dashboardService.findPLLastYear().then((r) => r.data), enabled: isAdmin })
  const invoices  = useQuery({ queryKey: ['invoice-status'], queryFn: () => dashboardService.findInvoiceStatus().then((r) => r.data), enabled: isAdmin })
  const poState30   = useQuery({ queryKey: ['po-state-30'],   queryFn: () => dashboardService.findPurchaseOrderStateLast30().then((r) => r.data), enabled: isAdmin })
  const poStateYear = useQuery({ queryKey: ['po-state-year'], queryFn: () => dashboardService.findPurchaseOrderStateLastYear().then((r) => r.data), enabled: isAdmin })

  const ordersData  = period === '30d' ? ordersDay.data  : ordersMonth.data
  const revenueData = period === '30d' ? revenueDay.data : revenueMonth.data
  const isOrdersLoading  = period === '30d' ? ordersDay.isLoading  : ordersMonth.isLoading
  const isRevenueLoading = period === '30d' ? revenueDay.isLoading : revenueMonth.isLoading

  const sellersData = sellersPeriod === '30d' ? sellers30.data : sellersYear.data

  const poStateData  = period === '30d' ? poState30.data  : poStateYear.data
  const plData       = period === '30d' ? pl30.data       : plYear.data

  const revenueTotal = revenueData?.reduce((s, p) => s + p.value, 0) ?? 0

  const ordersChartData = {
    labels: ordersData?.map((p) => p.key) ?? [],
    datasets: [{ data: ordersData?.map((p) => p.value) ?? [], backgroundColor: PRIMARY }],
  }

  const wms = wmsOrders.data
  const pickCount  = wms?.ordersToPick.length  ?? 0
  const packCount  = wms?.ordersToPack.length  ?? 0
  const shipCount  = wms?.ordersToShip.length  ?? 0
  const pickTotal  = wms?.ordersToPick.reduce((s, o) => s + (o.total ?? 0), 0)  ?? 0
  const packTotal  = wms?.ordersToPack.reduce((s, o) => s + (o.total ?? 0), 0)  ?? 0
  const shipTotal  = wms?.ordersToShip.reduce((s, o) => s + (o.total ?? 0), 0)  ?? 0

  const wmsChartData = {
    labels: ['To Pick', 'To Pack', 'To Ship'],
    datasets: [{ data: [pickCount, packCount, shipCount], backgroundColor: ['#dc2626', '#f97316', '#2563eb'] }],
  }

  const invoiceChartData = {
    labels: invoices.data?.map((r) => r.key) ?? [],
    datasets: [{ data: invoices.data?.map((r) => r.value) ?? [], backgroundColor: [PRIMARY, PRIMARY_LIGHT, '#9ca3af'] }],
  }

  const poStateChartData = {
    labels: poStateData?.map((r) => r.state) ?? [],
    datasets: [{ data: poStateData?.map((r) => r.qty) ?? [], backgroundColor: [PRIMARY, PRIMARY_LIGHT] }],
  }

  const periodLabel = period === '30d' ? 'Last 30 Days' : 'Last 12 Months'

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex rounded border text-sm">
          <button onClick={() => setPeriod('30d')}  className={`px-3 py-1.5 ${period === '30d'   ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>30 Days</button>
          <button onClick={() => setPeriod('year')} className={`px-3 py-1.5 ${period === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>12 Months</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Orders chart */}
        <div className="rounded border p-4">
          <p className="mb-2 text-sm font-semibold">Sales Orders — {periodLabel}</p>
          {isOrdersLoading ? <LoadingSpinner /> : <Bar data={ordersChartData} options={barOptions} />}
        </div>

        {/* Revenue */}
        <div className="rounded border p-4">
          <p className="mb-2 text-sm font-semibold">Revenue — {periodLabel}</p>
          {isRevenueLoading ? <LoadingSpinner /> : (
            <>
              <p className="mb-3 text-2xl font-bold">${fmt(revenueTotal)}</p>
              <Bar
                data={{
                  labels: revenueData?.map((p) => p.key) ?? [],
                  datasets: [{ data: revenueData?.map((p) => p.value) ?? [], backgroundColor: PRIMARY_LIGHT, borderColor: PRIMARY, borderWidth: 1 }],
                }}
                options={barOptions}
              />
            </>
          )}
        </div>

        {/* Admin: P&L */}
        {isAdmin && (
          <>
            <div className="rounded border p-4">
              <p className="mb-3 text-sm font-semibold">Profit & Loss — {periodLabel}</p>
              {pl30.isLoading ? <LoadingSpinner /> : plData && (
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Revenue" value={`$${fmt(plData.totalRevenue)}`} />
                  <MetricCard label="Cost" value={`$${fmt(plData.totalCost)}`} />
                  <MetricCard
                    label="Profit"
                    value={`$${fmt(plData.totalRevenue - plData.totalCost)}`}
                    sub={plData.totalRevenue > 0 ? `${(((plData.totalRevenue - plData.totalCost) / plData.totalRevenue) * 100).toFixed(1)}%` : undefined}
                  />
                </div>
              )}
            </div>

            {/* Invoice Status */}
            <div className="rounded border p-4">
              <p className="mb-2 text-sm font-semibold">Invoice Status</p>
              {invoices.isLoading ? <LoadingSpinner /> : invoices.data && (
                <div className="flex items-center gap-4">
                  <div className="h-48 w-48">
                    <Doughnut data={invoiceChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                  <ul className="space-y-1 text-sm">
                    {invoices.data.map((r) => (
                      <li key={r.key} className="flex justify-between gap-6">
                        <span className="text-muted-foreground">{r.key}</span>
                        <span className="font-medium">{r.value.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* PO State */}
            <div className="rounded border p-4">
              <p className="mb-2 text-sm font-semibold">Purchase Order Activity — {periodLabel}</p>
              {(poState30.isLoading || poStateYear.isLoading) ? <LoadingSpinner /> : poStateData && (
                <Bar data={poStateChartData} options={barOptions} />
              )}
            </div>
          </>
        )}

        {/* WMS Pipeline */}
        <div className="rounded border p-4">
          <p className="mb-2 text-sm font-semibold">Fulfillment Pipeline</p>
          {wmsOrders.isLoading ? <LoadingSpinner /> : wms && (
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <Doughnut data={wmsChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-red-600">To Pick ({pickCount})</p>
                  <p className="text-muted-foreground">${fmt(pickTotal)}</p>
                </div>
                <div>
                  <p className="font-semibold text-orange-500">To Pack ({packCount})</p>
                  <p className="text-muted-foreground">${fmt(packTotal)}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">To Ship ({shipCount})</p>
                  <p className="text-muted-foreground">${fmt(shipTotal)}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="font-semibold">Total</p>
                  <p className="text-muted-foreground">${fmt(pickTotal + packTotal + shipTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="rounded border p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Top Sellers</p>
            <div className="flex rounded border text-sm">
              <button onClick={() => setSellersPeriod('30d')}  className={`px-3 py-1 ${sellersPeriod === '30d'   ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>30 Days</button>
              <button onClick={() => setSellersPeriod('year')} className={`px-3 py-1 ${sellersPeriod === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Last Year</button>
            </div>
          </div>
          {(sellers30.isLoading || sellersYear.isLoading) ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Product ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Qty Sold</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sellersData?.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/products/${s.id}`} className="text-blue-600 hover:underline">{s.id}</Link>
                    </td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 text-right">{s.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${fmt(s.total)}</td>
                  </tr>
                ))}
                {!sellersData?.length && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No data.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
