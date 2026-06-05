import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { dashboardService } from '../services/dashboardService'
import { useAuth } from '../../../auth/useAuth'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

const PRIMARY = 'rgba(0, 76, 153, 0.85)'

const chartOptions = {
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

export function SalesDashboard() {
  const [period, setPeriod] = useState<'30d' | 'year'>('30d')
  const [sellersPeriod, setSellersPeriod] = useState<'30d' | 'year'>('30d')
  const hasRole = useAuth((s) => s.hasRole)
  const isAdmin = hasRole('ADMIN')

  const ordersDay   = useQuery({ queryKey: ['orders-day'],   queryFn: () => dashboardService.findOrdersByDay().then((r) => r.data) })
  const ordersMonth = useQuery({ queryKey: ['orders-month'], queryFn: () => dashboardService.findOrdersByMonth().then((r) => r.data) })
  const revenueDay   = useQuery({ queryKey: ['revenue-day'],   queryFn: () => dashboardService.findRevenueByDay().then((r) => r.data) })
  const revenueMonth = useQuery({ queryKey: ['revenue-month'], queryFn: () => dashboardService.findRevenueByMonth().then((r) => r.data) })
  const convDay   = useQuery({ queryKey: ['conv-day'],   queryFn: () => dashboardService.findOrderConversionByDay().then((r) => r.data) })
  const convMonth = useQuery({ queryKey: ['conv-month'], queryFn: () => dashboardService.findOrderConversionByMonth().then((r) => r.data) })
  const sellers30   = useQuery({ queryKey: ['sellers-30'],   queryFn: () => dashboardService.findTopSellersLast30Days().then((r) => r.data) })
  const sellersYear = useQuery({ queryKey: ['sellers-year'], queryFn: () => dashboardService.findTopSellersLastYear().then((r) => r.data) })
  const pl30   = useQuery({ queryKey: ['pl-30'],   queryFn: () => dashboardService.findPLLast30Days().then((r) => r.data), enabled: isAdmin })
  const plYear = useQuery({ queryKey: ['pl-year'], queryFn: () => dashboardService.findPLLastYear().then((r) => r.data), enabled: isAdmin })

  const ordersData  = period === '30d' ? ordersDay.data   : ordersMonth.data
  const revenueData = period === '30d' ? revenueDay.data  : revenueMonth.data
  const convData    = period === '30d' ? convDay.data     : convMonth.data
  const plData      = period === '30d' ? pl30.data        : plYear.data
  const sellersData = sellersPeriod === '30d' ? sellers30.data : sellersYear.data

  const isOrdersLoading  = period === '30d' ? ordersDay.isLoading  : ordersMonth.isLoading
  const isRevenueLoading = period === '30d' ? revenueDay.isLoading : revenueMonth.isLoading
  const isConvLoading    = period === '30d' ? convDay.isLoading    : convMonth.isLoading

  const revenueTotal = revenueData?.reduce((s, p) => s + p.value, 0) ?? 0
  const convRate = convData && convData.totalOrders > 0
    ? ((convData.convertedOrders / convData.totalOrders) * 100).toFixed(1)
    : null

  const periodLabel = period === '30d' ? 'Last 30 Days' : 'Last 12 Months'

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Orders Dashboard</h1>
        <div className="flex rounded border text-sm">
          <button onClick={() => setPeriod('30d')}  className={`px-3 py-1.5 ${period === '30d'   ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>30 Days</button>
          <button onClick={() => setPeriod('year')} className={`px-3 py-1.5 ${period === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>12 Months</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Orders chart */}
        <div className="rounded border p-4">
          <p className="mb-2 text-sm font-semibold">Sales Orders — {periodLabel}</p>
          {isOrdersLoading ? <LoadingSpinner /> : (
            <Bar
              data={{
                labels: ordersData?.map((p) => p.key) ?? [],
                datasets: [{ data: ordersData?.map((p) => p.value) ?? [], backgroundColor: PRIMARY }],
              }}
              options={chartOptions}
            />
          )}
        </div>

        {/* Conversion Rate */}
        <div className="rounded border p-4">
          <p className="mb-2 text-sm font-semibold">Order Conversion Rate — {periodLabel}</p>
          {isConvLoading ? <LoadingSpinner /> : convData && (
            <>
              <p className="mb-3 text-2xl font-bold">
                {convRate != null ? `${convRate}%` : '—'}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({convData.convertedOrders} / {convData.totalOrders})
                </span>
              </p>
              <Line
                data={{
                  labels: convData.items.map((i) => i.orderDate),
                  datasets: [{
                    data: convData.items.map((i) => i.conversionRate),
                    borderColor: PRIMARY,
                    backgroundColor: 'rgba(0, 76, 153, 0.1)',
                    fill: true,
                    tension: 0.3,
                  }],
                }}
                options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { beginAtZero: true, max: 100 } } }}
              />
            </>
          )}
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
                  datasets: [{ data: revenueData?.map((p) => p.value) ?? [], backgroundColor: 'rgba(204, 229, 255, 0.85)', borderColor: PRIMARY, borderWidth: 1 }],
                }}
                options={chartOptions}
              />
            </>
          )}
        </div>

        {/* Admin: P&L */}
        {isAdmin && (
          <div className="rounded border p-4">
            <p className="mb-3 text-sm font-semibold">Profit & Loss — {periodLabel}</p>
            {(pl30.isLoading || plYear.isLoading) ? <LoadingSpinner /> : plData && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Revenue', value: `$${fmt(plData.totalRevenue)}` },
                  { label: 'Cost',    value: `$${fmt(plData.totalCost)}` },
                  { label: 'Profit',  value: `$${fmt(plData.totalRevenue - plData.totalCost)}` },
                ].map((m) => (
                  <div key={m.label} className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-lg font-bold">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Sellers */}
        <div className={`rounded border p-4 ${!isAdmin ? 'lg:col-span-2' : ''}`}>
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
                  <th className="px-3 py-2 text-right">Qty</th>
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
