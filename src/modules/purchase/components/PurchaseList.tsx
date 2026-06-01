import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const ALL_STATES: POState[] = ['DRAFT', 'SUBMITTED', 'ISSUED', 'RECEIVING', 'RECEIVED', 'CANCELLED', 'COMPLETE']

export function PurchaseList() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<'+' | '-'>('+')
  const [stateFilter, setStateFilter] = useState<POState | 'ALL'>('ALL')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase-orders', debouncedKeyword, page, sortBy, sortDirection, stateFilter],
    queryFn: () =>
      purchaseService.findPosByKeyword({
        keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : '*',
        page,
        resultsPerPage: 20,
        sortBy,
        sortDirection,
      }).then((r) => r.data),
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

  function handleStateFilter(state: POState | 'ALL') {
    setStateFilter(state)
    setPage(0)
  }

  const displayedResults = data
    ? stateFilter === 'ALL'
      ? data.results
      : data.results.filter((po) => po.state === stateFilter)
    : []

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Purchase Orders</li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search purchase orders..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => navigate('/new-purchase-order')}
          className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New Purchase Order
        </button>
      </div>

      {/* State filter buttons */}
      <div className="mb-4 flex flex-wrap gap-1">
        <button
          onClick={() => handleStateFilter('ALL')}
          className={`rounded border px-3 py-1 text-xs font-medium ${
            stateFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          ALL
        </button>
        {ALL_STATES.map((s) => (
          <button
            key={s}
            onClick={() => handleStateFilter(s)}
            className={`rounded border px-3 py-1 text-xs font-medium ${
              stateFilter === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {s}
          </button>
        ))}
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
                {displayedResults.map((po) => (
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
                {displayedResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No purchase orders found.
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
