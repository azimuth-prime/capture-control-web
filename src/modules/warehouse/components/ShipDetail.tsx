import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../../order/services/orderService'
import { shippingService } from '../services/shippingService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
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

export function ShipDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [carrierId, setCarrierId] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [amount, setAmount] = useState<number>(0)

  const { data: order, isLoading: orderLoading, isError: orderError, error: orderErr, refetch } = useQuery({
    queryKey: ['ship-order', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  })

  const { data: carriers, isLoading: carriersLoading } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => shippingService.findAllCarriers().then((r) => r.data),
  })

  const shipMutation = useMutation({
    mutationFn: () => {
      if (!order) throw new Error('No order loaded')
      return shippingService
        .shipOrder({ id: order.id, carrierId, trackingNumber, amount })
        .then((r) => r.data)
    },
    onSuccess: () => {
      addToast('Order shipped successfully.', true)
      queryClient.invalidateQueries({ queryKey: ['ship-order', id] })
      queryClient.invalidateQueries({ queryKey: ['shippable-orders'] })
      refetch()
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Ship order failed.', false),
  })

  if (orderLoading || carriersLoading) return <LoadingSpinner message='Loading...' />
  if (orderError) return <ErrorMessage title='Failed to load order' message={(orderErr as Error).message} onRetry={refetch} />
  if (!order) return null

  const shipInfo = order.price?.shipInfo
  const isShipped = order.state === 'SHIPPED' || order.state === 'PARTIAL_SHIP'

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li><Link to='/shipping' className='hover:underline'>Shipping</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>{order.id}</li>
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
          <h1 className='text-xl font-semibold'>Ship Order</h1>
          <p className='text-sm text-muted-foreground'>
            {order.customer?.name} &mdash;{' '}
            <span className='rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800'>
              {order.state}
            </span>
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* Ship-to address */}
        <div className='rounded-lg border bg-card p-4'>
          <h2 className='mb-3 font-semibold'>Ship To</h2>
          {order.shipToAddress ? (
            <address className='not-italic text-sm text-muted-foreground'>
              {order.shipToAddress.companyName && <div>{order.shipToAddress.companyName}</div>}
              {order.shipToAddress.contactName && <div>{order.shipToAddress.contactName}</div>}
              {order.shipToAddress.address1 && <div>{order.shipToAddress.address1}</div>}
              {order.shipToAddress.address2 && <div>{order.shipToAddress.address2}</div>}
              {order.shipToAddress.city && (
                <div>
                  {order.shipToAddress.city}, {order.shipToAddress.province}{' '}
                  {order.shipToAddress.postalCode}
                </div>
              )}
              {order.shipToAddress.country && <div>{order.shipToAddress.country}</div>}
            </address>
          ) : (
            <p className='text-sm text-muted-foreground'>No shipping address on file.</p>
          )}
        </div>

        {/* Existing ship info (if already shipped) */}
        {isShipped && shipInfo?.carrier && (
          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-semibold'>Shipping Info</h2>
            <dl className='space-y-1 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-muted-foreground'>Carrier</dt>
                <dd>{shipInfo.carrier.name}</dd>
              </div>
              {shipInfo.trackingNumber && (
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>Tracking #</dt>
                  <dd className='font-mono text-xs'>{shipInfo.trackingNumber}</dd>
                </div>
              )}
              {shipInfo.amount != null && (
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>Shipping Amount</dt>
                  <dd>${shipInfo.amount.toFixed(2)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Ship form */}
      {!isShipped && (
        <div className='mt-4 rounded-lg border bg-card p-4'>
          <h2 className='mb-4 font-semibold'>Ship This Order</h2>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Carrier <span className='text-destructive'>*</span>
              </label>
              <select
                value={carrierId}
                onChange={(e) => setCarrierId(e.target.value)}
                className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              >
                <option value=''>-- Select carrier --</option>
                {carriers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium'>Tracking Number</label>
              <input
                type='text'
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder='e.g. 1Z999AA10123456784'
                className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium'>Shipping Amount</label>
              <input
                type='number'
                min={0}
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              />
            </div>
          </div>
          <div className='mt-4 flex justify-end'>
            <button
              onClick={() => shipMutation.mutate()}
              disabled={shipMutation.isPending || !carrierId}
              className='rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
            >
              {shipMutation.isPending ? 'Shipping...' : 'Ship Order'}
            </button>
          </div>
        </div>
      )}

      {/* Order items summary */}
      <div className='mt-4 overflow-x-auto rounded-lg border bg-card'>
        <h2 className='border-b px-4 py-3 font-semibold'>Order Items</h2>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
              <th className='px-4 py-2'>Product</th>
              <th className='px-4 py-2 text-right'>Qty Ordered</th>
              <th className='px-4 py-2 text-right'>Qty Shipped</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className='border-b hover:bg-muted/40'>
                <td className='px-4 py-2'>{item.sku?.productName}</td>
                <td className='px-4 py-2 text-right'>{item.quantityOrdered}</td>
                <td className='px-4 py-2 text-right'>{item.quantityShipped ?? 0}</td>
              </tr>
            ))}
            {order.items.length === 0 && (
              <tr>
                <td colSpan={3} className='px-4 py-8 text-center text-muted-foreground'>
                  No items on this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
