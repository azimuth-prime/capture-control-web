import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { PriceListItem, RestockItem } from '../types'
import type { ApiError } from '../../../shared/types'

// module-scope toast counter
let toastCounter = 0

interface Toast {
  id: number
  message: string
  success: boolean
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  function addToast(message: string, success: boolean) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, success }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  return { toasts, addToast }
}

export function VendorPriceListDetail() {
  // The :id param IS the supplierId
  const { id: supplierId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  // Track inline edits per item id
  const [itemEdits, setItemEdits] = useState<Record<string, Partial<PriceListItem>>>({})

  // SKU search modal
  const [skuModalOpen, setSkuModalOpen] = useState(false)
  const [skuKeyword, setSkuKeyword] = useState('')
  const [skuPage, setSkuPage] = useState(0)
  const debouncedSkuKw = useDebounce(skuKeyword, 300)

  const { data: priceList, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor-price-list', supplierId],
    queryFn: () => purchaseService.findPriceListBySupplierId(supplierId!).then((r) => r.data),
    enabled: !!supplierId,
  })

  // SKU search (restock search)
  const skuSearchQuery = useQuery({
    queryKey: ['sku-search-pl', debouncedSkuKw, skuPage],
    queryFn: () =>
      purchaseService.findRestockByKeyword({
        keyword: debouncedSkuKw.length > 0 ? debouncedSkuKw.toUpperCase() : '*',
        page: skuPage,
        resultsPerPage: 10,
      }).then((r) => r.data),
    enabled: skuModalOpen,
  })

  const saveAllMutation = useMutation({
    mutationFn: () => {
      const items = (priceList?.items ?? []).map((item) => ({
        ...item,
        ...(itemEdits[item.id] ?? {}),
      }))
      return purchaseService.savePLItems({ supplierId: supplierId!, items }).then((r) => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['vendor-price-list', supplierId], data)
      setItemEdits({})
      addToast('Price list saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteItemMutation = useMutation<void, { response?: { data?: ApiError } }, string>({
    mutationFn: (itemId) => purchaseService.deletePriceListItem(itemId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-price-list', supplierId] })
      addToast('Item deleted.', true)
    },
    onError: (err) =>
      addToast(err.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const addSkuMutation = useMutation({
    mutationFn: (skuItem: RestockItem) => {
      const newItem: PriceListItem = {
        id: '',
        skuId: skuItem.skuId,
        productId: skuItem.productId,
        productName: skuItem.productName,
        unitCost: skuItem.unitCost ?? 0,
        leadTime: skuItem.leadTime,
      }
      const existingItems = priceList?.items ?? []
      return purchaseService.savePLItems({
        supplierId: supplierId!,
        items: [...existingItems, newItem],
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['vendor-price-list', supplierId], data)
      setSkuModalOpen(false)
      setSkuKeyword('')
      addToast('Item added.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Add item failed.', false),
  })

  function setItemEdit(itemId: string, field: keyof PriceListItem, value: string | number) {
    setItemEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  function getItemValue<K extends keyof PriceListItem>(item: PriceListItem, field: K): PriceListItem[K] {
    const edit = itemEdits[item.id]
    if (edit && field in edit) return (edit as Record<string, unknown>)[field as string] as PriceListItem[K]
    return item[field]
  }

  function inputCls() {
    return 'rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  }

  if (isLoading) return <LoadingSpinner message="Loading price list..." />
  if (isError) return <ErrorMessage title="Failed to load price list" message={(error as Error).message} onRetry={refetch} />
  if (!priceList) return null

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/vendor-price-lists" className="hover:underline">Vendor Price Lists</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{priceList.supplier?.name ?? supplierId}</li>
        </ol>
      </nav>

      {/* Toast stack */}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-3 text-sm shadow-lg ${
              t.success
                ? 'border border-green-300 bg-green-50 text-green-800'
                : 'border border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{priceList.supplier?.name} — Price List</h1>
          <p className="text-sm text-muted-foreground">{priceList.items.length} item{priceList.items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSkuModalOpen(true)}
            className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
          >
            Add Item
          </button>
          <button
            onClick={() => saveAllMutation.mutate()}
            disabled={saveAllMutation.isPending || Object.keys(itemEdits).length === 0}
            className="rounded border border-blue-600 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            {saveAllMutation.isPending ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Vendor Product ID</th>
              <th className="px-4 py-2">Vendor SKU ID</th>
              <th className="px-4 py-2 text-right">Unit Cost</th>
              <th className="px-4 py-2 text-right">Lead Time (days)</th>
              <th className="px-4 py-2">Stock Unit</th>
              <th className="px-4 py-2">UPC</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {priceList.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2">
                  <div>{item.productName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.skuId}</div>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={(getItemValue(item, 'vendorProductId') as string) ?? ''}
                    onChange={(e) => setItemEdit(item.id, 'vendorProductId', e.target.value)}
                    className={`${inputCls()} w-28`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={(getItemValue(item, 'vendorSkuId') as string) ?? ''}
                    onChange={(e) => setItemEdit(item.id, 'vendorSkuId', e.target.value)}
                    className={`${inputCls()} w-28`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={getItemValue(item, 'unitCost') as number}
                    onChange={(e) => setItemEdit(item.id, 'unitCost', Number(e.target.value))}
                    className={`${inputCls()} w-24 text-right`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    value={(getItemValue(item, 'leadTime') as number) ?? 0}
                    onChange={(e) => setItemEdit(item.id, 'leadTime', Number(e.target.value))}
                    className={`${inputCls()} w-20 text-right`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={(getItemValue(item, 'stockUnit') as string) ?? ''}
                    onChange={(e) => setItemEdit(item.id, 'stockUnit', e.target.value)}
                    className={`${inputCls()} w-20`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={(getItemValue(item, 'upc') as string) ?? ''}
                    onChange={(e) => setItemEdit(item.id, 'upc', e.target.value)}
                    className={`${inputCls()} w-28`}
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    disabled={deleteItemMutation.isPending}
                    className="text-xs text-destructive underline hover:no-underline disabled:opacity-40"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {priceList.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No items. Click "Add Item" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {priceList.items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => saveAllMutation.mutate()}
            disabled={saveAllMutation.isPending || Object.keys(itemEdits).length === 0}
            className="rounded border border-blue-600 px-4 py-1.5 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          >
            {saveAllMutation.isPending ? 'Saving...' : 'Save All'}
          </button>
        </div>
      )}

      {/* ── SKU SEARCH MODAL ── */}
      {skuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add SKU</h2>
              <button onClick={() => setSkuModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            <input
              type="text"
              placeholder="Search products / SKUs..."
              value={skuKeyword}
              onChange={(e) => { setSkuKeyword(e.target.value); setSkuPage(0) }}
              className="mb-4 w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {skuSearchQuery.isLoading && <LoadingSpinner message="Searching..." />}
            {skuSearchQuery.data && (
              <>
                <div className="max-h-80 overflow-y-auto rounded border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Color / Size</th>
                        <th className="px-3 py-2 text-right">Unit Cost</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuSearchQuery.data.results.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-muted/40">
                          <td className="px-3 py-2">
                            <div>{item.productName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.skuId}</div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(' / ') || '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {item.unitCost != null ? `$${item.unitCost.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => addSkuMutation.mutate(item)}
                              disabled={addSkuMutation.isPending}
                              className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                      {skuSearchQuery.data.results.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No results.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <Pagination
                    page={skuSearchQuery.data.page}
                    pages={skuSearchQuery.data.pages}
                    hasNext={skuSearchQuery.data.hasNext}
                    hasPrevious={skuSearchQuery.data.hasPrevious}
                    onPageChange={setSkuPage}
                  />
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSkuModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
