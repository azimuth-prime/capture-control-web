import { useState, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { useBarcodeScanner } from '../../../shared/hooks/useBarcodeScanner'
import type { PackOrderItem } from '../types'
import type { ApiError } from '../../../shared/types'

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

export function PackDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [localItems, setLocalItems] = useState<PackOrderItem[] | null>(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printQty, setPrintQty] = useState(1)
  // Track the last query data version we synced from, so barcode rescans refresh local state
  const lastSyncedDataRef = useRef<object | null>(null)

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pack-order', id],
    queryFn: () => warehouseService.findOrderForPacking(id!).then((r) => r.data),
    enabled: !!id,
  })

  // Sync local items whenever the query result object reference changes
  // (covers initial load and barcode-triggered refetches)
  if (order && order !== lastSyncedDataRef.current) {
    setLocalItems(order.items.map((item) => ({ ...item })))
    lastSyncedDataRef.current = order
  }

  const packItemMutation = useMutation({
    mutationFn: (inventoryId: string) =>
      warehouseService
        .packItem({ orderId: order!.orderId, inventoryId, quantity: 1 })
        .then((r) => r.data),
    onSuccess: (updated) => {
      setLocalItems(updated.items.map((item) => ({ ...item })))
      queryClient.setQueryData(['pack-order', id], updated)
      addToast('Item packed.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Pack item failed.', false),
  })

  const packOrderMutation = useMutation({
    mutationFn: () => {
      if (!order || !localItems) throw new Error('No order loaded')
      return warehouseService
        .packOrder({
          id: order.orderId,
          items: localItems.map((item) => ({
            skuId: item.skuId,
            lotSerial: item.lotSerial,
            quantity: item.quantityPacked,
            itemId: item.id,
            inventoryId: item.inventoryId,
          })),
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      addToast('Pack submitted successfully.', true)
      refetch()
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Submit pack failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () =>
      warehouseService.printPackSlip({ id: id!, qty: printQty }).then((r) => r.data),
    onSuccess: () => {
      setPrintModalOpen(false)
      addToast('Pack slip sent to printer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  const downloadMutation = useMutation({
    mutationFn: () => warehouseService.downloadPackingSlipPDF(id!).then((r) => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PackSlip#${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Download failed.', false),
  })

  const handleScan = useCallback(
    (barcode: string) => {
      if (!order) return
      if (barcode.includes('ORD')) {
        // Barcode is an order barcode — re-fetch to get updated state
        refetch()
        return
      }
      // Treat barcode as an inventory ID
      packItemMutation.mutate(barcode)
    },
    [order, refetch, packItemMutation],
  )

  useBarcodeScanner(handleScan)

  function updateItem(index: number, patch: Partial<PackOrderItem>) {
    setLocalItems((prev) =>
      prev
        ? prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
        : prev,
    )
  }

  function packAll(item: PackOrderItem, index: number) {
    updateItem(index, { quantityPacked: item.quantityOrdered })
  }

  function handleLotChange(index: number, lotId: string) {
    const item = localItems?.[index]
    if (!item) return
    const lot = item.lots.find((l) => l.id === lotId)
    if (!lot) return
    updateItem(index, {
      lotSerial: lot.name,
      inventoryId: lot.id,
      quantityPacked: Math.min(item.quantityOrdered, lot.quantity),
    })
  }

  if (isLoading) return <LoadingSpinner message='Loading pack order...' />
  if (isError) return <ErrorMessage title='Failed to load pack order' message={(error as Error).message} onRetry={refetch} />
  if (!order) return null

  const items = localItems ?? order.items

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li><Link to='/packing' className='hover:underline'>Packing</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>{order.orderId}</li>
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
          <h1 className='text-xl font-semibold'>Pack Order</h1>
          <p className='text-sm text-muted-foreground'>
            Order: <span className='font-mono'>{order.orderId}</span>
            {order.customerName && <> &mdash; {order.customerName}</>}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Barcode scanner active &mdash; scan items to pack automatically.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setPrintModalOpen(true)}
            className='rounded border px-3 py-1.5 text-sm hover:bg-muted'
          >
            Print Pack Slip
          </button>
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className='rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40'
          >
            {downloadMutation.isPending ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={() => packOrderMutation.mutate()}
            disabled={packOrderMutation.isPending}
            className='rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
          >
            {packOrderMutation.isPending ? 'Submitting...' : 'Submit Pack'}
          </button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border bg-card'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
              <th className='px-4 py-2'>#</th>
              <th className='px-4 py-2'>Product</th>
              <th className='px-4 py-2'>Lot / Serial</th>
              <th className='px-4 py-2 text-right'>Qty Ordered</th>
              <th className='px-4 py-2 text-right'>Qty Packed</th>
              <th className='px-4 py-2'></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className='border-b hover:bg-muted/40'>
                <td className='px-4 py-2 text-muted-foreground'>{item.lineNumber}</td>
                <td className='px-4 py-2'>{item.productName}</td>
                <td className='px-4 py-2'>
                  {item.lots && item.lots.length > 0 ? (
                    <select
                      value={item.inventoryId}
                      onChange={(e) => handleLotChange(i, e.target.value)}
                      className='rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                    >
                      <option value=''>-- Select lot --</option>
                      {item.lots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          {lot.name} (qty: {lot.quantity})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className='font-mono text-xs'>{item.lotSerial || '—'}</span>
                  )}
                </td>
                <td className='px-4 py-2 text-right'>{item.quantityOrdered}</td>
                <td className='px-4 py-2 text-right'>
                  <input
                    type='number'
                    min={0}
                    max={item.quantityOrdered}
                    value={item.quantityPacked}
                    onChange={(e) => updateItem(i, { quantityPacked: Number(e.target.value) })}
                    className='w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                  />
                </td>
                <td className='px-4 py-2'>
                  <button
                    onClick={() => packAll(item, i)}
                    className='rounded border px-2 py-1 text-xs hover:bg-muted'
                  >
                    Pack All
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center text-muted-foreground'>
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print modal */}
      {printModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-xs rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Print Pack Slip</h2>
              <button onClick={() => setPrintModalOpen(false)} className='text-destructive hover:opacity-70'>✕</button>
            </div>
            <div className='mb-4'>
              <label className='mb-1 block text-sm font-medium'>Quantity</label>
              <input
                type='number'
                min={1}
                value={printQty}
                onChange={(e) => setPrintQty(Number(e.target.value))}
                className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setPrintModalOpen(false)}
                className='rounded border px-4 py-1.5 text-sm hover:bg-muted'
              >
                Cancel
              </button>
              <button
                onClick={() => printMutation.mutate()}
                disabled={printMutation.isPending}
                className='rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
              >
                {printMutation.isPending ? 'Printing...' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
