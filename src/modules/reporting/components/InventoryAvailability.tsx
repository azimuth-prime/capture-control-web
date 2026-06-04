import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { inventoryReportService } from '../services/inventoryReportService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'

export function InventoryAvailability() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventory-availability', debouncedKeyword, page],
    queryFn: () =>
      inventoryReportService
        .findInventoryAvailability({ keyword: debouncedKeyword || '*', page, resultsPerPage: 30 })
        .then((r) => r.data),
  })

  const downloadMutation = useMutation({
    mutationFn: () =>
      inventoryReportService
        .inventoryAvailabilityDownload({ keyword: debouncedKeyword || '*', page: 0, resultsPerPage: -1 })
        .then((r) => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'InventoryAvailability.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Inventory Availability</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Inventory Availability</h1>
      <p className="mb-3 text-sm text-muted-foreground">
        Type a product name, product ID, SKU ID or warehouse to filter results.
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
                  <th className="px-3 py-2">SKU ID</th>
                  <th className="px-3 py-2">Product ID</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2 text-right">On Hand</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.results.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.skuId ? (
                        <Link to={`/products/skus/${row.skuId}`} className="text-blue-600 hover:underline">
                          {row.skuId}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.productId ?? '—'}</td>
                    <td className="px-3 py-2">{row.productName ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{row.onHand.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{row.available.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.location ?? '—'}</td>
                    <td className="px-3 py-2">{row.warehouseName ?? '—'}</td>
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
