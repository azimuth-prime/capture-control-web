import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { POState } from '../types'

const STATE_CLASSES: Record<POState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  RECEIVING: 'bg-orange-100 text-orange-800',
  RECEIVED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETE: 'bg-green-100 text-green-800',
}

export function PurchaseByState() {
  const { state } = useParams<{ state: string }>()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<'+' | '-'>('+')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase-orders-by-state', state, debouncedKeyword, page, sortBy, sortDirection],
    queryFn: () =>
      purchaseService.findPurchaseOrdersByState({
        keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : undefined,
        page,
        resultsPerPage: 20,
        filters: [{ state: state! }],
      }).then((r) => r.data),
    enabled: !!state,
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
          <li><Link to="/purchase" className="hover:underline">Purchase Orders</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{state}</li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          Purchase Orders —{' '}
          <span
            className={`rounded-full px-2 py-0.5 text-sm font-medium ${
              STATE_CLASSES[state as POState] ?? 'bg-muted text-muted-foreground'
            }`}
          >
            {state}
          </span>
        </h1>
        <input
          type="text"
          placeholder="Search..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && <LoadingSpinner message="Loading purchase orders..." />}
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
                    PO ID
                    {sortBy === 'id' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('supplierName')}
                  >
                    Supplier
                    {sortBy === 'supplierName' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th className="px-4 py-2">Warehouse</th>
                  <th className="px-4 py-2">State</th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('creationDate')}
                  >
                    Created
                    {sortBy === 'creationDate' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th className="px-4 py-2">PO Number</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => navigate(`/purchase/${po.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{po.id.substring(0, 8)}…</td>
                    <td className="px-4 py-2">{po.supplierName}</td>
                    <td className="px-4 py-2">{po.warehouseName ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATE_CLASSES[po.state] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {po.state}
                      </span>
                    </td>
                    <td className="px-4 py-2">{po.creationDate?.substring(0, 10) ?? '—'}</td>
                    <td className="px-4 py-2">{po.poNumber ?? '—'}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No purchase orders found for state: {state}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} purchase order{data.totalResults !== 1 ? 's' : ''}
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
