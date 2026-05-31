import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { findInvoiceByKeyword } from '../services/invoiceService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { InvoiceState } from '../types'

const STATE_CLASSES: Record<InvoiceState, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  INVOICED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-orange-100 text-orange-800',
}

export function InvoiceList() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortDirection, setSortDirection] = useState<'+' | '-'>('+')

  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices', debouncedKeyword, page, sortBy, sortDirection],
    queryFn: () =>
      findInvoiceByKeyword({
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
          <li className="font-medium text-foreground">Invoices</li>
        </ol>
      </nav>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search invoices..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && <LoadingSpinner message="Loading invoices..." />}
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
                    Invoice #
                    {sortBy === 'id' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer
                    {sortBy === 'customerName' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('invoiceDate')}
                  >
                    Invoice Date
                    {sortBy === 'invoiceDate' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-2 hover:text-foreground"
                    onClick={() => handleSort('dueDate')}
                  >
                    Due Date
                    {sortBy === 'dueDate' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                  <th className="px-4 py-2">Status</th>
                  <th
                    className="cursor-pointer px-4 py-2 text-right hover:text-foreground"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total
                    {sortBy === 'totalAmount' && <span className="ml-1">{sortDirection === '+' ? '↑' : '↓'}</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoice/${inv.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{inv.id}</td>
                    <td className="px-4 py-2">{inv.customerName}</td>
                    <td className="px-4 py-2">{inv.invoiceDate?.substring(0, 10)}</td>
                    <td className="px-4 py-2">{inv.dueDate?.substring(0, 10)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATE_CLASSES[inv.status] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} invoice{data.totalResults !== 1 ? 's' : ''}
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
