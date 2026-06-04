import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { inventoryReportService } from '../services/inventoryReportService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'

export function ProductAvailability() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product-availability', debouncedKeyword, page],
    queryFn: () =>
      inventoryReportService
        .findProductAvailability({ keyword: debouncedKeyword || '*', page, resultsPerPage: 30 })
        .then((r) => r.data),
  })

  const downloadMutation = useMutation({
    mutationFn: () =>
      inventoryReportService
        .productAvailabilityDownload({ keyword: debouncedKeyword || '*', page: 0, resultsPerPage: -1 })
        .then((r) => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ProductAvailability.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Product Availability</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Product Availability</h1>
      <p className="mb-3 text-sm text-muted-foreground">
        Type a product name, product ID, warehouse or SKU ID to filter results.
      </p>

      <input
        type="text"
        placeholder="Keyword search..."
        value={keyword}
        onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
        className="mb-4 w-full max-w-md rounded border px-3 py-2 text-sm"
      />

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load report.'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.totalResults.toLocaleString()} results
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
              >
                {downloadMutation.isPending ? 'Exporting...' : 'Export to Excel'}
              </button>
              <button
                onClick={() => window.print()}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Print
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Product ID</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2 text-right">On Hand</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2">Creation Date</th>
                  <th className="px-3 py-2">Stock Unit</th>
                  <th className="px-3 py-2">Control Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.results.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link to={`/products/${row.id}`} className="text-blue-600 hover:underline">
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-right">{row.onHand.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{row.available.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.creationDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{row.stockUnit ?? '—'}</td>
                    <td className="px-3 py-2">{row.controlType ?? '—'}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <Pagination
              page={page}
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
