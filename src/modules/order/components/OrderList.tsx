import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '../services/orderService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { OrderStatus } from '../types'

const STATE_CLASSES: Partial<Record<OrderStatus, string>> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  QUOTE: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  BOOKED: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-orange-100 text-orange-800',
  PICKING: 'bg-orange-100 text-orange-800',
  PICKED: 'bg-orange-100 text-orange-800',
  PACKING: 'bg-orange-100 text-orange-800',
  PACKED: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-green-100 text-green-800',
  PARTIAL_SHIP: 'bg-teal-100 text-teal-800',
  INVOICED: 'bg-purple-100 text-purple-800',
  COMPLETE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  BACKORDERED: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-700',
}

export function OrderList() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<'+' | '-'>('+')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', debouncedKeyword, page, sortBy, sortDirection],
    queryFn: () =>
      orderService.searchOrders({
        keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : '*',
        page,
        resultsPerPage: 30,
        sortBy,
        sortDirection,
      }),
  })

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortDirection((d) => (d === '+' ? '-' : '+'))
    } else {
      setSortBy(column)
      setSortDirection('+')
    }
    setPage(0)
  }

  function handleKeywordChange(value: string) {
    setKeyword(value)
    setPage(0)
  }

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Sales Orders</li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search orders..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => navigate('/new-order')}
          className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New Order
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading orders..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('id')}
                  >
                    Order #
                    {sortBy === 'id' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer
                    {sortBy === 'customerName' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th className="px-4 py-2">Warehouse</th>
                  <th className="px-4 py-2">Status</th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('submittedDate')}
                  >
                    Submitted
                    {sortBy === 'submittedDate' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('shippedDate')}
                  >
                    Shipped
                    {sortBy === 'shippedDate' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 text-right hover:text-foreground"
                    onClick={() => handleSort('total')}
                  >
                    Total
                    {sortBy === 'total' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/order/${order.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-2">{order.customerName}</td>
                    <td className="px-4 py-2">{order.warehouseName ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATE_CLASSES[order.state] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {order.state}
                      </span>
                    </td>
                    <td className="px-4 py-2">{order.submittedDate?.substring(0, 10) ?? '—'}</td>
                    <td className="px-4 py-2">{order.shippedDate?.substring(0, 10) ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-mono">${order.total.toFixed(2)}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} order{data.totalResults !== 1 ? 's' : ''}
            </p>
            <Pagination
              page={data.page}
              pages={Math.min(data.pages, 20)}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
