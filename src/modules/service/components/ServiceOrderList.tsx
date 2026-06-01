import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { serviceService } from '../services/serviceService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ServiceOrderState } from '../types'

const STATE_CLASSES: Record<ServiceOrderState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function ServiceOrderList() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<'+' | '-'>('+')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-orders', debouncedKeyword, page, sortBy, sortDirection],
    queryFn: () =>
      serviceService
        .findByKeyword({
          keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : '*',
          page,
          resultsPerPage: 30,
          sortBy,
          sortDirection,
        })
        .then((r) => r.data),
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
          <li className="font-medium text-foreground">Service Orders</li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search service orders..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => navigate('/new-serviceorder')}
          className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New Service Order
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading service orders..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">SO #</th>
                  <th className="px-4 py-2">Supplier / Customer</th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('state')}
                  >
                    State
                    {sortBy === 'state' && (
                      <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('creationDate')}
                  >
                    Created
                    {sortBy === 'creationDate' && (
                      <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((so) => (
                  <tr
                    key={so.id}
                    onClick={() => navigate(`/serviceorder/${so.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{so.id}</td>
                    <td className="px-4 py-2">{so.supplierName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATE_CLASSES[so.state] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {so.state}
                      </span>
                    </td>
                    <td className="px-4 py-2">{so.creationDate?.substring(0, 10) ?? '—'}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No service orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} service order{data.totalResults !== 1 ? 's' : ''}
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
