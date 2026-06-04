import { Link } from 'react-router-dom'

const INVENTORY_REPORTS = [
  { path: '/reporting/inventory-adjustments', label: 'Inventory Adjustments' },
  { path: '/reporting/inventory-spot-count', label: 'Inventory Spot Count' },
  { path: '/reporting/product-availability', label: 'Product Availability' },
  { path: '/reporting/inventory-receipts', label: 'Inventory Receipts' },
  { path: '/reporting/inventory-count-location', label: 'Inventory Count / Location' },
  { path: '/reporting/inventory-transfers', label: 'Inventory Transfers' },
  { path: '/reporting/inventory-availability', label: 'Inventory Availability' },
  { path: '/reporting/inventory-audit', label: 'Inventory Audit' },
]

const SALES_REPORTS = [
  { path: '/reporting/sales-orders-by-dates', label: 'Sales Orders by Date' },
  { path: '/reporting/cancelled-sales-orders', label: 'Cancelled Sales Orders' },
  { path: '/reporting/backordered-sales-orders', label: 'Backordered Sales Orders' },
  { path: '/reporting/overdue-sales-orders', label: 'Overdue Sales Orders' },
  { path: '/reporting/sales-orders-by-salesperson', label: 'Sales by Salesperson' },
  { path: '/reporting/sales-orders-by-customer', label: 'Sales by Customer' },
]

export function ReportingLanding() {
  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Reporting</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border">
          <div className="border-b bg-muted/50 px-4 py-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Inventory
            </p>
          </div>
          <ul className="divide-y">
            {INVENTORY_REPORTS.map((r) => (
              <li key={r.path}>
                <Link
                  to={r.path}
                  className="block px-4 py-2.5 text-sm hover:bg-muted/50 hover:text-primary"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border">
          <div className="border-b bg-muted/50 px-4 py-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sales
            </p>
          </div>
          <ul className="divide-y">
            {SALES_REPORTS.map((r) => (
              <li key={r.path}>
                <Link
                  to={r.path}
                  className="block px-4 py-2.5 text-sm hover:bg-muted/50 hover:text-primary"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
