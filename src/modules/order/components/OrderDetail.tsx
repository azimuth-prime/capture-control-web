import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { orderService } from '../services/orderService'
import { useAuth } from '../../../auth/useAuth'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { Order, OrderStatus, EmailRequest } from '../types'
import type { ApiError } from '../../../shared/types'

// module-scope so the counter doesn't reset on every render
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

const emailSchema = z.object({
  to: z.string().min(1, 'Recipient required'),
  cc: z.string(),
  bcc: z.string(),
  subject: z.string().min(1, 'Subject required'),
  content: z.string().min(1, 'Content required'),
  type: z.enum(['SALESORDER', 'SALESQUOTE']),
})
type EmailValues = z.infer<typeof emailSchema>

const COMPLETED_STATES: OrderStatus[] = ['SHIPPED', 'INVOICED', 'COMPLETE', 'RETURNED']

function stateColor(state: OrderStatus) {
  const map: Partial<Record<OrderStatus, string>> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    QUOTE: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    BOOKED: 'bg-indigo-100 text-indigo-800',
    PROCESSING: 'bg-orange-100 text-orange-800',
    PICKING: 'bg-orange-100 text-orange-800',
    PICKED: 'bg-orange-100 text-orange-800',
    PACKING: 'bg-orange-100 text-orange-800',
    PACKED: 'bg-orange-100 text-orange-800',
    SHIPPED: 'bg-green-100 text-green-800',
    PARTIAL_SHIP: 'bg-teal-100 text-teal-800',
    INVOICED: 'bg-purple-100 text-purple-800',
    COMPLETE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    BACKORDERED: 'bg-red-100 text-red-800',
    OVERDUE: 'bg-red-100 text-red-800',
    RETURNED: 'bg-gray-100 text-gray-700',
  }
  return map[state] ?? 'bg-muted text-muted-foreground'
}

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()
  const { toasts, addToast } = useToast()

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printQty, setPrintQty] = useState(1)
  const [stateMenuOpen, setStateMenuOpen] = useState(false)

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: !!id,
  })

  // --- changeOrderState with optimistic update and rollback ---
  const changeStateMutation = useMutation<Order, { response?: { data?: ApiError } }, OrderStatus>({
    mutationFn: (state) => orderService.changeOrderState({ id: id!, state }),
    onMutate: async (newState) => {
      await queryClient.cancelQueries({ queryKey: ['order', id] })
      const previous = queryClient.getQueryData<Order>(['order', id])
      if (previous) {
        queryClient.setQueryData<Order>(['order', id], { ...previous, state: newState })
      }
      return { previous }
    },
    onError: (_err, _newState, context) => {
      const ctx = context as { previous?: Order } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData(['order', id], ctx.previous)
      }
      addToast((_err as { response?: { data?: ApiError } }).response?.data?.errorMessage ?? 'State change failed.', false)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['order', id], data)
      addToast(`Order state changed to: ${data.state}`, true)
    },
    onSettled: () => setStateMenuOpen(false),
  })

  const bookOrderMutation = useMutation<Order, { response?: { data?: ApiError } }>({
    mutationFn: () => orderService.bookOrder(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['order', id], data)
      addToast('Order booked.', true)
    },
    onError: (err) => addToast(err.response?.data?.errorMessage ?? 'Book failed.', false),
  })

  const generateInvoiceMutation = useMutation<Order, { response?: { data?: ApiError } }>({
    mutationFn: () => orderService.generateInvoice(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['order', id], data)
      addToast('Invoice generated.', true)
    },
    onError: (err) => addToast(err.response?.data?.errorMessage ?? 'Invoice generation failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () => orderService.printOrder({ id: id!, qty: printQty }),
    onSuccess: () => {
      setPrintModalOpen(false)
      addToast('Order sent to printer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  const downloadMutation = useMutation({
    mutationFn: () => orderService.downloadOrderPDF(id!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SalesOrder#${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Download failed.', false),
  })

  const emailMutation = useMutation<void, { response?: { data?: ApiError } }, EmailValues>({
    mutationFn: (values) =>
      orderService.sendOrderEmail({
        id: id!,
        type: values.type,
        to: values.to.split(',').map((s) => s.trim()).filter(Boolean),
        cc: values.cc ? values.cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        bcc: values.bcc ? values.bcc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        subject: values.subject,
        content: values.content,
      } as EmailRequest),
    onSuccess: () => {
      setEmailModalOpen(false)
      emailForm.reset()
      addToast('Email sent.', true)
    },
    onError: (err) => addToast(err.response?.data?.errorMessage ?? 'Send failed.', false),
  })

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onTouched',
    defaultValues: {
      to: '',
      cc: currentUser?.email ?? '',
      bcc: '',
      subject: '',
      content: '',
      type: 'SALESORDER',
    },
  })

  if (isLoading) return <LoadingSpinner message="Loading order..." />
  if (isError) return <ErrorMessage title="Failed to load order" message={(error as Error).message} onRetry={refetch} />
  if (!order) return null

  const isCompleted = COMPLETED_STATES.includes(order.state)
  const showInvoiceButton =
    !order.invoice &&
    order.state !== 'CANCELLED' &&
    order.state !== 'QUOTE' &&
    order.state !== 'COMPLETE' &&
    order.price.paymentTerm === 'PREPAID'

  const taxTotal = order.price.taxes.reduce((sum, t) => sum + t.amount, 0)
  const discountTotal =
    order.suborders.length > 0
      ? order.suborders.reduce(
          (sum, sub) => sum + sub.price.discounts.reduce((s, d) => s + d.savings, 0),
          0
        )
      : order.price.discounts.reduce((sum, d) => sum + d.savings, 0)

  const availableTransitions: OrderStatus[] = (() => {
    switch (order.state) {
      case 'DRAFT': return ['QUOTE', 'SUBMITTED']
      case 'QUOTE': return ['SUBMITTED', 'CANCELLED']
      case 'SUBMITTED': return ['BOOKED', 'CANCELLED']
      case 'BOOKED': return ['PROCESSING', 'CANCELLED']
      default: return []
    }
  })()

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/order" className="hover:underline">Orders</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{id}</li>
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
          <h1 className="text-xl font-semibold">Order #{id}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColor(order.state)}`}>
              {order.state}
            </span>
            <span className="text-sm text-muted-foreground">{order.customer?.name}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* State change dropdown */}
          {availableTransitions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setStateMenuOpen((v) => !v)}
                disabled={changeStateMutation.isPending}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                Change State ▾
              </button>
              {stateMenuOpen && (
                <div className="absolute right-0 z-10 mt-1 rounded border bg-white shadow-lg">
                  {availableTransitions.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStateMutation.mutate(s)}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {order.state === 'SUBMITTED' && (
            <button
              onClick={() => bookOrderMutation.mutate()}
              disabled={bookOrderMutation.isPending}
              className="rounded border border-indigo-600 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
            >
              {bookOrderMutation.isPending ? 'Booking...' : 'Book Order'}
            </button>
          )}

          {showInvoiceButton && (
            <button
              onClick={() => generateInvoiceMutation.mutate()}
              disabled={generateInvoiceMutation.isPending}
              className="rounded border border-purple-600 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 disabled:opacity-40"
            >
              {generateInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </button>
          )}

          {order.invoice && (
            <button
              onClick={() => navigate(`/invoice/${order.invoice!.id}`)}
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              View Invoice
            </button>
          )}

          {isCompleted && (
            <>
              <button onClick={() => setPrintModalOpen(true)} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Print</button>
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                {downloadMutation.isPending ? 'Downloading...' : 'Download PDF'}
              </button>
            </>
          )}

          <button
            onClick={() => {
              emailForm.reset({
                to: '',
                cc: currentUser?.email ?? '',
                bcc: '',
                subject: order.state === 'QUOTE' ? `Sales Quote #: ${id}` : `Sales Order #: ${id}`,
                content: '',
                type: order.state === 'QUOTE' ? 'SALESQUOTE' : 'SALESORDER',
              })
              setEmailModalOpen(true)
            }}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Order info */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Order Details</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{order.creationDate?.substring(0, 10)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{order.submittedDate?.substring(0, 10) ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Requested Ship</dt>
              <dd>{order.requestedShipDate?.substring(0, 10) ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipped</dt>
              <dd>{order.shippedDate?.substring(0, 10) ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd>{order.warehouse?.name ?? '—'}</dd>
            </div>
            {order.poNumber && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">PO #</dt>
                <dd>{order.poNumber}</dd>
              </div>
            )}
            {order.soldBy && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sales Rep</dt>
                <dd>{order.soldBy.name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Bill to */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Bill To</h2>
          <address className="not-italic text-sm text-muted-foreground">
            {order.billToAddress?.companyName && <div>{order.billToAddress.companyName}</div>}
            {order.billToAddress?.contactName && <div>{order.billToAddress.contactName}</div>}
            {order.billToAddress?.address1 && <div>{order.billToAddress.address1}</div>}
            {order.billToAddress?.city && (
              <div>
                {order.billToAddress.city}, {order.billToAddress.province} {order.billToAddress.postalCode}
              </div>
            )}
            {order.billToAddress?.country && <div>{order.billToAddress.country}</div>}
          </address>
        </div>

        {/* Ship to */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Ship To</h2>
          <address className="not-italic text-sm text-muted-foreground">
            {order.shipToAddress?.companyName && <div>{order.shipToAddress.companyName}</div>}
            {order.shipToAddress?.contactName && <div>{order.shipToAddress.contactName}</div>}
            {order.shipToAddress?.address1 && <div>{order.shipToAddress.address1}</div>}
            {order.shipToAddress?.city && (
              <div>
                {order.shipToAddress.city}, {order.shipToAddress.province} {order.shipToAddress.postalCode}
              </div>
            )}
            {order.shipToAddress?.country && <div>{order.shipToAddress.country}</div>}
          </address>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit Price</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
              <th className="px-4 py-2">Tax</th>
              <th className="px-4 py-2">Terms</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-muted/40">
                <td className="px-4 py-2 text-muted-foreground">{item.lineNumber}</td>
                <td className="px-4 py-2">
                  <div>{item.sku.productName}</div>
                  {item.sku.description && <div className="text-xs text-muted-foreground">{item.sku.description}</div>}
                </td>
                <td className="px-4 py-2 text-right">{item.quantityOrdered}</td>
                <td className="px-4 py-2 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono">
                  ${(item.quantityOrdered * item.unitPrice).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-xs">{item.tax}</td>
                <td className="px-4 py-2 text-xs">{item.salesTerms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price summary */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">${order.price.subtotal.toFixed(2)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discounts</span>
              <span className="font-mono">-${discountTotal.toFixed(2)}</span>
            </div>
          )}
          {taxTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-mono">${taxTotal.toFixed(2)}</span>
            </div>
          )}
          {(order.price.shipInfo?.amount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-mono">${order.price.shipInfo.amount!.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-semibold">
            <span>Total</span>
            <span className="font-mono">${order.price.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Suborders */}
      {order.suborders.length > 0 && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Suborders</h2>
          <div className="space-y-2">
            {order.suborders.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <span className="font-mono text-xs">{sub.id}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateColor(sub.state)}`}>
                  {sub.state}
                </span>
                <span className="font-mono">${sub.price.total.toFixed(2)}</span>
                {sub.invoice && (
                  <button
                    onClick={() => navigate(`/invoice/${sub.invoice!.id}`)}
                    className="text-xs underline hover:no-underline"
                  >
                    Invoice
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Print Order</h2>
              <button onClick={() => setPrintModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Quantity</label>
              <input
                type="number"
                min={1}
                value={printQty}
                onChange={(e) => setPrintQty(Number(e.target.value))}
                className={inputCls()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPrintModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => printMutation.mutate()}
                disabled={printMutation.isPending}
                className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                {printMutation.isPending ? 'Printing...' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL MODAL ── */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Email Order</h2>
              <button onClick={() => setEmailModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {emailMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (emailMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Send failed.'
                  }
                />
              </div>
            )}
            <form onSubmit={emailForm.handleSubmit((v) => emailMutation.mutate(v))} noValidate>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <select {...emailForm.register('type')} className={inputCls()}>
                    <option value="SALESORDER">Sales Order</option>
                    <option value="SALESQUOTE">Sales Quote</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">To <span className="text-destructive">*</span></label>
                  <p className="mb-1 text-xs text-muted-foreground">Comma-separated email addresses.</p>
                  <input type="text" {...emailForm.register('to')} className={inputCls(!!emailForm.formState.errors.to)} />
                  {emailForm.formState.errors.to && <p className="mt-1 text-xs text-destructive">{emailForm.formState.errors.to.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">CC</label>
                  <input type="text" {...emailForm.register('cc')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">BCC</label>
                  <input type="text" {...emailForm.register('bcc')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Subject <span className="text-destructive">*</span></label>
                  <input type="text" {...emailForm.register('subject')} className={inputCls(!!emailForm.formState.errors.subject)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Content <span className="text-destructive">*</span></label>
                  <textarea {...emailForm.register('content')} rows={5} className={inputCls(!!emailForm.formState.errors.content)} />
                  {emailForm.formState.errors.content && <p className="mt-1 text-xs text-destructive">{emailForm.formState.errors.content.message}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEmailModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={emailMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {emailMutation.isPending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
