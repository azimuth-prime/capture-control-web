import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'
import type { TransferItem, AvailableInventory } from '../types'

let toastCounter = 0

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; success: boolean }[]>([])
  function addToast(message: string, success: boolean) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, success }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }
  return { toasts, addToast }
}

export function TransferDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [inventoryKeyword, setInventoryKeyword] = useState('')
  const [inventoryPage, setInventoryPage] = useState(0)

  const debouncedKeyword = useDebounce(inventoryKeyword, 300)

  const { data: transfer, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transfer', id],
    queryFn: () => warehouseService.findTransferById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const inventoryQuery = useQuery({
    queryKey: ['available-inventory', debouncedKeyword, inventoryPage, transfer?.fromWarehouse?.name],
    queryFn: () =>
      warehouseService
        .findAvailableInventoryByKeyword({
          keyword: debouncedKeyword.length > 0 ? debouncedKeyword : '*',
          page: inventoryPage,
          resultsPerPage: 10,
          filters: transfer?.fromWarehouse?.name ? [transfer.fromWarehouse.name] : [],
        })
        .then((r) => r.data),
    enabled: addItemModalOpen && !!transfer,
  })

  const addItemMutation = useMutation({
    mutationFn: (inventoryId: string) =>
      warehouseService
        .addItemToTransfer({ transferId: id!, inventoryId })
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['transfer', id], updated)
      addToast('Item added to transfer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Add item failed.', false),
  })

  const removeItemMutation = useMutation({
    mutationFn: (item: TransferItem) =>
      warehouseService
        .removeItemFromTransfer({ transferId: id!, id: item.id })
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['transfer', id], updated)
      addToast('Item removed.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Remove item failed.', false),
  })

  const transferStockMutation = useMutation({
    mutationFn: () => warehouseService.transferStock(id!).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['transfer', id], updated)
      queryClient.invalidateQueries({ queryKey: ['open-transfers'] })
      addToast('Stock transferred successfully.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Transfer stock failed.', false),
  })

  function handleAddItem(inv: AvailableInventory) {
    addItemMutation.mutate(inv.id)
  }

  function openAddItemModal() {
    setInventoryKeyword('')
    setInventoryPage(0)
    setAddItemModalOpen(true)
  }

  if (isLoading) return <LoadingSpinner message='Loading transfer...' />
  if (isError) return <ErrorMessage title='Failed to load transfer' message={(error as Error).message} onRetry={refetch} />
  if (!transfer) return null

  const canTransfer = transfer.state === 'NEW' && transfer.items.length > 0

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li><Link to='/transfer' className='hover:underline'>Transfers</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>{transfer.id}</li>
        </ol>
      </nav>

      {toasts.map((t) => (
        <div
          key={t.id}
          className={`mb-3 rounded-md p-3 text-sm ${
            t.success
              ? 'border border-green-300 bg-green-50 text-green-800'
              : 'border border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {t.message}
        </div>
      ))}

      <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-xl font-semibold'>Transfer</h1>
          <p className='text-sm text-muted-foreground'>
            {transfer.fromWarehouse?.name ?? '—'} &rarr; {transfer.toWarehouse?.name ?? '—'} &mdash;{' '}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                transfer.state === 'COMPLETE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {transfer.state}
            </span>
          </p>
        </div>
        <div className='flex gap-2'>
          {transfer.state === 'NEW' && (
            <button
              onClick={openAddItemModal}
              className='rounded border px-3 py-1.5 text-sm hover:bg-muted'
            >
              + Add Item
            </button>
          )}
          {canTransfer && (
            <button
              onClick={() => transferStockMutation.mutate()}
              disabled={transferStockMutation.isPending}
              className='rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
            >
              {transferStockMutation.isPending ? 'Transferring...' : 'Transfer Stock'}
            </button>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className='overflow-x-auto rounded-lg border bg-card'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
              <th className='px-4 py-2'>Product</th>
              <th className='px-4 py-2'>SKU</th>
              <th className='px-4 py-2'>Lot / Serial</th>
              <th className='px-4 py-2 text-right'>Quantity</th>
              {transfer.state === 'NEW' && <th className='px-4 py-2'></th>}
            </tr>
          </thead>
          <tbody>
            {transfer.items.map((item) => (
              <tr key={item.id} className='border-b hover:bg-muted/40'>
                <td className='px-4 py-2'>{item.productName}</td>
                <td className='px-4 py-2 font-mono text-xs'>{item.skuId}</td>
                <td className='px-4 py-2 font-mono text-xs'>{item.lotSerial ?? '—'}</td>
                <td className='px-4 py-2 text-right'>{item.quantity}</td>
                {transfer.state === 'NEW' && (
                  <td className='px-4 py-2'>
                    <button
                      onClick={() => removeItemMutation.mutate(item)}
                      disabled={removeItemMutation.isPending}
                      className='rounded border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40'
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {transfer.items.length === 0 && (
              <tr>
                <td
                  colSpan={transfer.state === 'NEW' ? 5 : 4}
                  className='px-4 py-8 text-center text-muted-foreground'
                >
                  No items on this transfer. Add items to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item modal */}
      {addItemModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Add Inventory Item</h2>
              <button onClick={() => setAddItemModalOpen(false)} className='text-destructive hover:opacity-70'>✕</button>
            </div>
            <p className='mb-3 text-xs text-muted-foreground'>
              Searching available inventory in: <strong>{transfer.fromWarehouse?.name}</strong>
            </p>
            <input
              type='text'
              placeholder='Search by product name, SKU or lot...'
              value={inventoryKeyword}
              onChange={(e) => {
                setInventoryKeyword(e.target.value)
                setInventoryPage(0)
              }}
              className='mb-4 w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              autoFocus
            />

            {inventoryQuery.isLoading && <LoadingSpinner message='Searching inventory...' />}
            {inventoryQuery.isError && (
              <ErrorMessage message={(inventoryQuery.error as Error).message} />
            )}

            {inventoryQuery.data && (
              <>
                <div className='max-h-72 overflow-y-auto rounded border'>
                  <table className='w-full text-sm'>
                    <thead className='sticky top-0 bg-muted/80'>
                      <tr className='border-b text-left text-muted-foreground'>
                        <th className='px-3 py-2'>Product</th>
                        <th className='px-3 py-2'>SKU</th>
                        <th className='px-3 py-2'>Lot / Serial</th>
                        <th className='px-3 py-2'>Location</th>
                        <th className='px-3 py-2 text-right'>Qty</th>
                        <th className='px-3 py-2'></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryQuery.data.results.map((inv) => (
                        <tr key={inv.id} className='border-b hover:bg-muted/40'>
                          <td className='px-3 py-1.5'>{inv.productName}</td>
                          <td className='px-3 py-1.5 font-mono text-xs'>{inv.sku ?? inv.skuId}</td>
                          <td className='px-3 py-1.5 font-mono text-xs'>{inv.lotSerial ?? '—'}</td>
                          <td className='px-3 py-1.5'>{inv.location ?? '—'}</td>
                          <td className='px-3 py-1.5 text-right'>{inv.quantity}</td>
                          <td className='px-3 py-1.5'>
                            <button
                              onClick={() => handleAddItem(inv)}
                              disabled={addItemMutation.isPending}
                              className='rounded border border-green-600 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40'
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                      {inventoryQuery.data.results.length === 0 && (
                        <tr>
                          <td colSpan={6} className='px-3 py-6 text-center text-muted-foreground'>
                            No inventory found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className='mt-3 flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>
                    {inventoryQuery.data.totalResults} result{inventoryQuery.data.totalResults !== 1 ? 's' : ''}
                  </p>
                  <Pagination
                    page={inventoryQuery.data.page}
                    pages={Math.min(inventoryQuery.data.pages, 10)}
                    hasNext={inventoryQuery.data.hasNext}
                    hasPrevious={inventoryQuery.data.hasPrevious}
                    onPageChange={setInventoryPage}
                  />
                </div>
              </>
            )}

            <div className='mt-4 flex justify-end'>
              <button
                onClick={() => setAddItemModalOpen(false)}
                className='rounded border px-4 py-1.5 text-sm hover:bg-muted'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
