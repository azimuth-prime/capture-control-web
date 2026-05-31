import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  findInvoiceById,
  receivePayment,
  cancelInvoice,
  printInvoice,
  downloadInvoicePDF,
  sendInvoiceEmail,
} from '../services/invoiceService'
import { useAuth } from '../../../auth/useAuth'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { PaymentMethod, PaymentFormValues, EmailFormValues } from '../types'
import type { ApiError } from '../../../shared/types'

const paymentSchema = z.object({
  paymentMethod: z.enum(['CREDIT_CARD', 'CHECK', 'WIRE', 'CASH']),
  amount: z.coerce.number().positive('Amount must be positive'),
  notes: z.string(),
})

const emailSchema = z.object({
  to: z.string().min(1, 'Recipient required'),
  cc: z.string(),
  bcc: z.string(),
  subject: z.string().min(1, 'Subject required'),
  content: z.string().min(1, 'Content required'),
})

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()

  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [printQty, setPrintQty] = useState(1)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: invoice, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => findInvoiceById(id!),
    enabled: !!id,
  })

  const paymentMutation = useMutation<unknown, { response?: { data?: ApiError } }, PaymentFormValues>({
    mutationFn: (values) =>
      receivePayment({ id: id!, ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      setPaymentModalOpen(false)
      paymentForm.reset()
      showToast('Payment received.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Payment failed.', false),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      showToast('Invoice cancelled.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Cancel failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () => printInvoice({ id: id!, qty: printQty }),
    onSuccess: () => {
      setPrintModalOpen(false)
      showToast('Invoice sent to printer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  const downloadMutation = useMutation({
    mutationFn: () => downloadInvoicePDF(id!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice#${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Download failed.', false),
  })

  const emailMutation = useMutation<void, { response?: { data?: ApiError } }, EmailFormValues>({
    mutationFn: (values) =>
      sendInvoiceEmail({
        id: id!,
        to: values.to.split(',').map((s) => s.trim()).filter(Boolean),
        cc: values.cc ? values.cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        bcc: values.bcc ? values.bcc.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        subject: values.subject,
        content: values.content,
      }),
    onSuccess: () => {
      setEmailModalOpen(false)
      emailForm.reset()
      showToast('Email sent.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Send failed.', false),
  })

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: 'onTouched',
    defaultValues: { paymentMethod: 'CHECK', amount: 0, notes: '' },
  })

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onTouched',
    defaultValues: {
      to: '',
      // configService not yet migrated; defaults to false (show button)
      cc: currentUser?.email ?? '',
      bcc: '',
      subject: id ? `Invoice #: ${id}` : '',
      content: '',
    },
  })

  if (isLoading) return <LoadingSpinner message="Loading invoice..." />
  if (isError) return <ErrorMessage title="Failed to load invoice" message={(error as Error).message} onRetry={refetch} />
  if (!invoice) return null

  const amountDue = invoice.total - invoice.amountPaid
  const rawSubtotal = invoice.order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantityShipped,
    0
  )
  const discountTotal = invoice.order.price.discounts.reduce((sum, d) => sum + d.savings, 0)
  const taxTotal = invoice.order.price.taxes.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/invoice" className="hover:underline">Invoices</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{id}</li>
        </ol>
      </nav>

      {toast && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            toast.success
              ? 'border border-green-300 bg-green-50 text-green-800'
              : 'border border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Invoice #{id}</h1>
          <p className="text-sm text-muted-foreground">
            {invoice.order.customer?.name} &mdash; {invoice.state}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.state !== 'PAID' && invoice.state !== 'CANCELLED' && (
            <button
              onClick={() => {
                paymentForm.setValue('amount', Math.max(0, amountDue))
                setPaymentModalOpen(true)
              }}
              className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
            >
              Receive Payment
            </button>
          )}
          {invoice.state !== 'CANCELLED' && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Cancel Invoice
            </button>
          )}
          <button
            onClick={() => setPrintModalOpen(true)}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Print
          </button>
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
          >
            {downloadMutation.isPending ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={() => {
              emailForm.reset({
                to: '',
                cc: currentUser?.email ?? '',
                bcc: '',
                subject: `Invoice #: ${id}`,
                content: '',
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
        {/* Invoice info */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Invoice Details</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Invoice Date</dt>
              <dd>{invoice.invoiceDate?.substring(0, 10)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Due Date</dt>
              <dd>{invoice.dueDate?.substring(0, 10)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment Term</dt>
              <dd>{invoice.paymentTerm ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">State</dt>
              <dd>{invoice.state}</dd>
            </div>
          </dl>
        </div>

        {/* Bill to */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Bill To</h2>
          {invoice.order.billToAddress ? (
            <address className="not-italic text-sm text-muted-foreground">
              {invoice.order.billToAddress.companyName && <div>{invoice.order.billToAddress.companyName}</div>}
              {invoice.order.billToAddress.contactName && <div>{invoice.order.billToAddress.contactName}</div>}
              {invoice.order.billToAddress.address1 && <div>{invoice.order.billToAddress.address1}</div>}
              {invoice.order.billToAddress.city && (
                <div>
                  {invoice.order.billToAddress.city}, {invoice.order.billToAddress.province} {invoice.order.billToAddress.postalCode}
                </div>
              )}
              {invoice.order.billToAddress.country && <div>{invoice.order.billToAddress.country}</div>}
            </address>
          ) : (
            <p className="text-sm text-muted-foreground">No billing address on file.</p>
          )}
        </div>

        {/* Payment summary */}
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Payment Summary</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>${rawSubtotal.toFixed(2)}</dd>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Discounts</dt>
                <dd>-${discountTotal.toFixed(2)}</dd>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxes</dt>
                <dd>${taxTotal.toFixed(2)}</dd>
              </div>
            )}
            {invoice.order.price.shipInfo.amount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>${invoice.order.price.shipInfo.amount.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <dt>Total</dt>
              <dd>${invoice.total.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between text-green-700">
              <dt>Paid</dt>
              <dd>${invoice.amountPaid.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-destructive">
              <dt>Balance Due</dt>
              <dd>${amountDue.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2 text-right">Qty Shipped</th>
              <th className="px-4 py-2 text-right">Unit Price</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.order.items.map((item, i) => (
              <tr key={i} className="border-b hover:bg-muted/40">
                <td className="px-4 py-2">
                  <div>{item.sku.productName}</div>
                </td>
                <td className="px-4 py-2 text-right">{item.quantityShipped}</td>
                <td className="px-4 py-2 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-mono">
                  ${(item.unitPrice * item.quantityShipped).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice.notes && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Receive Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {paymentMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (paymentMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Payment failed.'
                  }
                />
              </div>
            )}
            <form
              onSubmit={paymentForm.handleSubmit((v) => paymentMutation.mutate(v))}
              noValidate
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Method</label>
                  <select {...paymentForm.register('paymentMethod')} className={inputCls()}>
                    {(['CREDIT_CARD', 'CHECK', 'WIRE', 'CASH'] as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>{m.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    {...paymentForm.register('amount')}
                    className={inputCls(!!paymentForm.formState.errors.amount)}
                  />
                  {paymentForm.formState.errors.amount && (
                    <p className="mt-1 text-xs text-destructive">{paymentForm.formState.errors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Notes</label>
                  <textarea {...paymentForm.register('notes')} rows={2} className={inputCls()} />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setPaymentModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {paymentMutation.isPending ? 'Processing...' : 'Receive Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Print Invoice</h2>
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
              <h2 className="text-lg font-semibold">Email Invoice</h2>
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
            <form
              onSubmit={emailForm.handleSubmit((v) => emailMutation.mutate(v))}
              noValidate
            >
              <div className="space-y-3">
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
