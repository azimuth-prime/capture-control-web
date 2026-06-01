import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export function VendorPriceLists() {
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor-price-lists'],
    queryFn: () => purchaseService.findAllPriceLists().then((r) => r.data),
  })

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Vendor Price Lists</li>
        </ol>
      </nav>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vendor Price Lists</h1>
      </div>

      {isLoading && <LoadingSpinner message="Loading price lists..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2">Supplier Name</th>
                <th className="px-4 py-2 text-right">Item Count</th>
                <th className="px-4 py-2">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pl) => (
                <tr
                  key={pl.supplierId}
                  onClick={() => navigate(`/vendor-price-list/${pl.supplierId}`)}
                  className="cursor-pointer border-b hover:bg-muted/40"
                >
                  <td className="px-4 py-2 font-medium">{pl.supplierName}</td>
                  <td className="px-4 py-2 text-right">{pl.itemCount}</td>
                  <td className="px-4 py-2">{pl.lastUpdated?.substring(0, 10) ?? '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No price lists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
