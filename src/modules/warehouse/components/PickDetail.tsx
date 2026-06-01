import { useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { PickSlipItem } from '../types'
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

export function PickDetail() {
  const { id } = useParams<{ id: string }>()
  const { toasts, addToast } = useToast()

  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printQty, setPrintQty] = useState(1)
  // local editable quantities keyed by item index; seeded lazily from query data
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const initializedRef = useRef(false)

  const { data: pickslip, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pick-slip', id],
    queryFn: () => warehouseService.findPickSlipById(id!).then((r) => r.data),
    enabled: !!id,
  })

  // Seed local quantities once on first data arrival (not a data-fetch effect)
  if (pickslip && !initializedRef.current) {
    const init: Record<number, number> = {}
    pickslip.items.forEach((item, i) => { init[i] = item.quantityPicked })
    setQuantities(init)
    initializedRef.current = true
  }

  const pickMutation = useMutation({
    mutationFn: () => {
      if (!pickslip) throw new Error('No pickslip loaded')
      const items = pickslip.items.map((item, i) => ({
        skuId: item.skuId,
        quantity: quantities[i] ?? item.quantityPicked,
      }))
      return warehouseService.pickOrder({ id: pickslip.orderId, items }).then((r) => r.data)
    },
    onSuccess: () => {
      addToast('Pick submitted successfully.', true)
      refetch()
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Submit pick failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () =>
      warehouseService.printPickSlip({ id: id!, qty: printQty }).then((r) => r.data),
    onSuccess: () => {
      setPrintModalOpen(false)
      addToast('Pick slip sent to printer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  function setQty(index: number, value: number) {
    setQuantities((prev) => ({ ...prev, [index]: Math.max(0, value) }))
  }

  function pickAll(item: PickSlipItem, index: number) {
    setQuantities((prev) => ({ ...prev, [index]: item.quantityOrdered }))
  }

  if (isLoading) return <LoadingSpinner message='Loading pick slip...' />
  if (isError) return <ErrorMessage title='Failed to load pick slip' message={(error as Error).message} onRetry={refetch} />
  if (!pickslip) return null

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li><Link to='/picking' className='hover:underline'>Picking</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>{pickslip.orderId}</li>
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
          <h1 className='text-xl font-semibold'>Pick Slip</h1>
          <p className='text-sm text-muted-foreground'>
            Order: <span className='font-mono'>{pickslip.orderId}</span>
            {pickslip.customerName && <> &mdash; {pickslip.customerName}</>}
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setPrintModalOpen(true)}
            className='rounded border px-3 py-1.5 text-sm hover:bg-muted'
          >
            Print Pick Slip
          </button>
          <button
            onClick={() => pickMutation.mutate()}
            disabled={pickMutation.isPending}
            className='rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
          >
            {pickMutation.isPending ? 'Submitting...' : 'Submit Pick'}
          </button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border bg-card'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
              <th className='px-4 py-2'>Product</th>
              <th className='px-4 py-2'>SKU</th>
              <th className='px-4 py-2'>Lot / Serial</th>
              <th className='px-4 py-2'>Location</th>
              <th className='px-4 py-2 text-right'>Qty Ordered</th>
              <th className='px-4 py-2 text-right'>Qty Picked</th>
              <th className='px-4 py-2'></th>
            </tr>
          </thead>
          <tbody>
            {pickslip.items.map((item, i) => (
              <tr key={i} className='border-b hover:bg-muted/40'>
                <td className='px-4 py-2'>{item.productName}</td>
                <td className='px-4 py-2 font-mono text-xs'>{item.sku ?? item.skuId}</td>
                <td className='px-4 py-2 font-mono text-xs'>{item.lotSerial ?? '—'}</td>
                <td className='px-4 py-2'>{item.location ?? '—'}</td>
                <td className='px-4 py-2 text-right'>{item.quantityOrdered}</td>
                <td className='px-4 py-2 text-right'>
                  <input
                    type='number'
                    min={0}
                    max={item.quantityOrdered}
                    value={quantities[i] ?? item.quantityPicked}
                    onChange={(e) => setQty(i, Number(e.target.value))}
                    className='w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                  />
                </td>
                <td className='px-4 py-2'>
                  <button
                    onClick={() => pickAll(item, i)}
                    className='rounded border px-2 py-1 text-xs hover:bg-muted'
                  >
                    Pick All
                  </button>
                </td>
              </tr>
            ))}
            {pickslip.items.length === 0 && (
              <tr>
                <td colSpan={7} className='px-4 py-8 text-center text-muted-foreground'>
                  No items on this pick slip.
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
              <h2 className='text-lg font-semibold'>Print Pick Slip</h2>
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
