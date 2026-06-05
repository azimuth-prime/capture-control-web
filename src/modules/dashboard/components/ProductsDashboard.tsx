import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

function MetricCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-2"><LoadingSpinner /></div>
      ) : (
        <p className="mt-1 text-2xl font-bold">{value}</p>
      )}
    </div>
  )
}

function fmt(n: number | undefined) {
  if (n == null) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDays(n: number | undefined) {
  if (n == null) return '—'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} days`
}

function fmtPct(n: number | undefined) {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

export function ProductsDashboard() {
  const avgVal30  = useQuery({ queryKey: ['inv-val-30'],   queryFn: () => dashboardService.findAvgInventoryValueLast30().then((r) => r.data) })
  const avgVal6m  = useQuery({ queryKey: ['inv-val-6m'],   queryFn: () => dashboardService.findAvgInventoryValueLast6Months().then((r) => r.data) })
  const avgValYr  = useQuery({ queryKey: ['inv-val-yr'],   queryFn: () => dashboardService.findAvgInventoryValueLastYear().then((r) => r.data) })

  const turn30  = useQuery({ queryKey: ['inv-turn-30'], queryFn: () => dashboardService.findInventoryTurnoverLast30().then((r) => r.data) })
  const turn6m  = useQuery({ queryKey: ['inv-turn-6m'], queryFn: () => dashboardService.findInventoryTurnoverLast6Months().then((r) => r.data) })
  const turnYr  = useQuery({ queryKey: ['inv-turn-yr'], queryFn: () => dashboardService.findInventoryTurnoverLastYear().then((r) => r.data) })

  const dsi30  = useQuery({ queryKey: ['inv-dsi-30'], queryFn: () => dashboardService.findDaysSalesLast30().then((r) => r.data) })
  const dsi6m  = useQuery({ queryKey: ['inv-dsi-6m'], queryFn: () => dashboardService.findDaysSalesLast6Months().then((r) => r.data) })
  const dsiYr  = useQuery({ queryKey: ['inv-dsi-yr'], queryFn: () => dashboardService.findDaysSalesLastYear().then((r) => r.data) })

  const ratio30 = useQuery({ queryKey: ['inv-ratio-30'], queryFn: () => dashboardService.findInventorySalesRatioLast30().then((r) => r.data) })
  const ratioYr = useQuery({ queryKey: ['inv-ratio-yr'], queryFn: () => dashboardService.findInventorySalesRatioLastYear().then((r) => r.data) })

  const period30 = useQuery({ queryKey: ['inv-period-30'], queryFn: () => dashboardService.findAvgInventoryPeriodLast30().then((r) => r.data) })
  const periodYr = useQuery({ queryKey: ['inv-period-yr'], queryFn: () => dashboardService.findAvgInventoryPeriodLastYear().then((r) => r.data) })

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Products Dashboard</h1>

      {/* Average Inventory Value */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Average Inventory Value</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Last 30 Days"  value={`$${fmt(avgVal30.data)}`} loading={avgVal30.isLoading} />
          <MetricCard label="Last 6 Months" value={`$${fmt(avgVal6m.data)}`} loading={avgVal6m.isLoading} />
          <MetricCard label="Last Year"     value={`$${fmt(avgValYr.data)}`} loading={avgValYr.isLoading} />
        </div>
      </section>

      {/* Inventory Turnover */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inventory Turnover</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Last 30 Days"  value={fmt(turn30.data)} loading={turn30.isLoading} />
          <MetricCard label="Last 6 Months" value={fmt(turn6m.data)} loading={turn6m.isLoading} />
          <MetricCard label="Last Year"     value={fmt(turnYr.data)} loading={turnYr.isLoading} />
        </div>
      </section>

      {/* Days Sales of Inventory */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Days Sales of Inventory</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Last 30 Days"  value={fmtDays(dsi30.data)} loading={dsi30.isLoading} />
          <MetricCard label="Last 6 Months" value={fmtDays(dsi6m.data)} loading={dsi6m.isLoading} />
          <MetricCard label="Last Year"     value={fmtDays(dsiYr.data)} loading={dsiYr.isLoading} />
        </div>
      </section>

      {/* Inventory to Sales Ratio */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inventory to Sales Ratio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="Last 30 Days" value={fmtPct(ratio30.data)} loading={ratio30.isLoading} />
          <MetricCard label="Last Year"    value={fmtPct(ratioYr.data)} loading={ratioYr.isLoading} />
        </div>
      </section>

      {/* Average Inventory Period */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Average Inventory Period</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="Last 30 Days" value={fmtDays(period30.data)} loading={period30.isLoading} />
          <MetricCard label="Last Year"    value={fmtDays(periodYr.data)} loading={periodYr.isLoading} />
        </div>
      </section>
    </div>
  )
}
