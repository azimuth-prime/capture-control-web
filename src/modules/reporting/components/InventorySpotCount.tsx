import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { inventoryReportService } from '../services/inventoryReportService'
import { warehouseService } from '../../warehouse/services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { SpotCheckRequest } from '../types'

export function InventorySpotCount() {
  const [warehouseId, setWarehouseId] = useState('')
  const [type, setType] = useState<'location' | 'product'>('location')
  const [quantity, setQuantity] = useState(10)
  const [filter, setFilter] = useState<SpotCheckRequest | null>(null)

  const warehousesQuery = useQuery({
    queryKey: ['physical-warehouses'],
    queryFn: () => warehouseService.findAllPhysicalWarehouses().then((r) => r.data),
  })

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['inv-spot-count', filter],
    queryFn: () => {
      if (!filter) return null
      const fn = filter.type === 'location'
        ? inventoryReportService.findSpotCheckByLocations
        : inventoryReportService.findSpotCheckByProducts
      return fn(filter).then((r) => r.data)
    },
    enabled: filter !== null,
  })

  function handleGenerate() {
    if (!warehouseId) return
    setFilter({ warehouseId, type, quantity })
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/reporting" className="hover:underline">Reporting</Link>
        <span>›</span>
        <span>Inventory Spot Count</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Inventory Spot Count</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Warehouse</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Select warehouse...</option>
            {warehousesQuery.data?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Count By</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'location' | 'product')}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="location">Location</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Quantity</label>
          <input
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24 rounded border px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!warehouseId || isFetching}
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isFetching ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {(isFetching || warehousesQuery.isLoading) && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as { errorMessage?: string })?.errorMessage ?? 'Failed to load report.'}
          onRetry={refetch}
        />
      )}

      {data && !isFetching && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.length.toLocaleString()} results
            </span>
            <button
              onClick={() => window.print()}
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Print
            </button>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Product ID</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2">SKU ID</th>
                  <th className="px-3 py-2">Lot / Serial</th>
                  <th className="px-3 py-2 text-right">On Hand</th>
                  <th className="px-3 py-2">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">{row.location ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.productId ?? '—'}</td>
                    <td className="px-3 py-2">{row.productName ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.skuId ? (
                        <Link to={`/products/skus/${row.skuId}`} className="text-blue-600 hover:underline">
                          {row.skuId}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2">{row.lotSerial ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{row.onHand.toLocaleString()}</td>
                    <td className="px-3 py-2">{row.warehouseName ?? '—'}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
