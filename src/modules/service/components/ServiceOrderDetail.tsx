import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceService } from '../services/serviceService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type {
  ServiceOrder,
  ServiceOrderState,
  ServiceOrderItem,
  ServiceOrderInvoicableItem,
} from '../types'
import type { Address, ApiError } from '../../../shared/types'

// ── module-scope toast counter ──
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

// ── helpers ──
const STATE_CLASSES: Record<ServiceOrderState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
    hasError ? 'border-destructive' : ''
  }`
}

type Tab = 'details' | 'items' | 'invoices' | 'notes'

// ── Inventory search modal ──
interface InventorySearchModalProps {
  taxes: string[]
  onAdd: (item: Omit<ServiceOrderItem, 'id'> & { id: string }) => void
  onClose: () => void
}

function InventorySearchModal({ taxes, onAdd, onClose }: InventorySearchModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ServiceOrderInvoicableItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [tax, setTax] = useState(taxes[0] ?? '')
  const [instructions, setInstructions] = useState('')

  // Use invoicable endpoint as a product search proxy; in practice this queries available items
  const { data: results, isLoading } = useQuery({
    queryKey: ['so-inventory-search', search],
    queryFn: () =>
      serviceService.findItemsForServiceOrderInvoice(search).then((r) => r.data),
    enabled: search.length > 1,
  })

  function handleAdd() {
    if (!selected) return
    onAdd({
      id: '',
      inventoryId: selected.id,
      productName: selected.productName,
      lotSerial: selected.lotSerial,
      quantity,
      unitPrice,
      tax,
      instructions,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-lg flex-col rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Item</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive">✕</button>
        </div>

        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />

        {isLoading && <LoadingSpinner message="Searching..." />}

        {results && results.length > 0 && !selected && (
          <ul className="mb-3 max-h-48 overflow-y-auto rounded border text-sm">
            {results.map((item) => (
              <li
                key={item.id}
                onClick={() => {
                  setSelected(item)
                  setUnitPrice(item.unitPrice)
                }}
                className="cursor-pointer border-b px-3 py-2 hover:bg-muted/40"
              >
                <span className="font-medium">{item.productName}</span>
                {item.lotSerial && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{item.lotSerial}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {results && results.length === 0 && search.length > 1 && !selected && (
          <p className="mb-3 text-sm text-muted-foreground">No results found.</p>
        )}

        {selected && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">{selected.productName}</span>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Change
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Unit Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className={inputCls()}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax</label>
              <select
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className={inputCls()}
              >
                <option value="">— None —</option>
                {taxes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                className={inputCls()}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Invoice Modal ──
interface AddInvoiceModalProps {
  serviceOrderId: string
  onSuccess: () => void
  onClose: () => void
  addToast: (message: string, success: boolean) => void
}

function AddInvoiceModal({ serviceOrderId, onSuccess, onClose, addToast }: AddInvoiceModalProps) {
  const [selected, setSelected] = useState<Record<string, number>>({})

  const { data: invoicable, isLoading } = useQuery({
    queryKey: ['so-invoicable', serviceOrderId],
    queryFn: () =>
      serviceService.findItemsForServiceOrderInvoice(serviceOrderId).then((r) => r.data),
  })

  const addInvoiceMutation = useMutation({
    mutationFn: () =>
      serviceService.addInvoice({
        serviceOrderId,
        items: Object.entries(selected)
          .filter(([, qty]) => qty > 0)
          .map(([id, quantity]) => ({ id, quantity })),
      }),
    onSuccess: () => {
      onSuccess()
      addToast('Invoice created.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Failed to create invoice.', false),
  })

  function toggleItem(id: string, maxQty: number) {
    setSelected((prev) => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: maxQty }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Invoice</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive">✕</button>
        </div>

        {isLoading && <LoadingSpinner message="Loading invoicable items..." />}

        {invoicable && invoicable.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">No invoicable items available.</p>
        )}

        {invoicable && invoicable.length > 0 && (
          <div className="mb-4 overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-3 py-2">Include</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {invoicable.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={item.id in selected}
                        onChange={() => toggleItem(item.id, item.quantity)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div>{item.productName}</div>
                      {item.lotSerial && (
                        <div className="font-mono text-xs text-muted-foreground">{item.lotSerial}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => addInvoiceMutation.mutate()}
            disabled={addInvoiceMutation.isPending || Object.keys(selected).length === 0}
            className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            {addInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──
export function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [printQty, setPrintQty] = useState(1)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  // Local item edits keyed by item id (or array index for new items)
  const [itemEdits, setItemEdits] = useState<ServiceOrderItem[]>([])
  const [itemsInitialized, setItemsInitialized] = useState(false)
  // Address form
  const [addressEdits, setAddressEdits] = useState<Partial<Address>>({})
  const [addressInitialized, setAddressInitialized] = useState(false)
  // Carrier input
  const [carrierId, setCarrierId] = useState('')

  const { data: so, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-order', id],
    queryFn: () => serviceService.findById(id!).then((r) => r.data),
    enabled: !!id,
    select: (data) => {
      // Initialize local copies on first load
      if (!itemsInitialized) {
        setItemEdits(data.items.map((item) => ({ ...item })))
        setItemsInitialized(true)
      }
      if (!addressInitialized) {
        setAddressEdits(data.supplierAddress ?? {})
        setAddressInitialized(true)
      }
      return data
    },
  })

  const { data: taxes } = useQuery({
    queryKey: ['so-taxes', id],
    queryFn: () => serviceService.findApplicableTaxes(id!).then((r) => r.data),
    enabled: !!id,
  })

  // ── mutations ──
  const issueMutation = useMutation<ServiceOrder, { response?: { data?: ApiError } }>({
    mutationFn: () => serviceService.issueServiceOrder(id!).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] })
      addToast('Service order issued.', true)
    },
    onError: (err) =>
      addToast(err.response?.data?.errorMessage ?? 'Issue failed.', false),
  })

  const cancelMutation = useMutation<ServiceOrder, { response?: { data?: ApiError } }>({
    mutationFn: () =>
      serviceService.changeState({ id: id!, state: 'CANCELLED' }).then((r) => r.data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['service-order', id] })
      const previous = queryClient.getQueryData<ServiceOrder>(['service-order', id])
      if (previous) {
        queryClient.setQueryData<ServiceOrder>(['service-order', id], {
          ...previous,
          state: 'CANCELLED',
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      const ctx = context as { previous?: ServiceOrder } | undefined
      if (ctx?.previous) {
        queryClient.setQueryData(['service-order', id], ctx.previous)
      }
      addToast(err.response?.data?.errorMessage ?? 'Cancel failed.', false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] })
      addToast('Service order cancelled.', true)
    },
  })

  const saveItemsMutation = useMutation({
    mutationFn: () =>
      serviceService
        .saveItems({
          serviceOrderId: id!,
          items: itemEdits.map((item) => ({
            id: item.id,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax,
            instructions: item.instructions,
          })),
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] })
      addToast('Items saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveAddressMutation = useMutation({
    mutationFn: () =>
      serviceService
        .saveSupplierAddress(addressEdits as Address, id!)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] })
      addToast('Address saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Address save failed.', false),
  })

  const setCarrierMutation = useMutation({
    mutationFn: () =>
      serviceService.setCarrier({ id: id!, carrierId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order', id] })
      addToast('Carrier updated.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Carrier update failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () =>
      serviceService.printServiceOrder({ id: id!, qty: printQty }).then((r) => r.data),
    onSuccess: () => {
      setPrintModalOpen(false)
      addToast('Sent to printer.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  const downloadMutation = useMutation({
    mutationFn: () => serviceService.downloadServiceOrderPDF(id!).then((r) => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ServiceOrder#${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Download failed.', false),
  })

  // ── item helpers ──
  function updateItemField(index: number, field: keyof ServiceOrderItem, value: string | number) {
    setItemEdits((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addNewItem(item: ServiceOrderItem) {
    setItemEdits((prev) => [...prev, item])
    setInventoryModalOpen(false)
  }

  function removeItem(index: number) {
    setItemEdits((prev) => prev.filter((_, i) => i !== index))
  }

  function addressField(field: keyof Address, value: string) {
    setAddressEdits((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) return <LoadingSpinner message="Loading service order..." />
  if (isError) return <ErrorMessage message={(error as Error).message} onRetry={refetch} />
  if (!so) return null

  const invoiceTotal = so.invoices.reduce((sum, inv) => sum + inv.priceInfo.total, 0)
  const canIssue = so.state === 'DRAFT'
  const canCancel = so.state !== 'CANCELLED' && so.state !== 'COMPLETE'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'items', label: `Items (${itemEdits.length})` },
    { key: 'invoices', label: `Invoices (${so.invoices.length})` },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/serviceorder" className="hover:underline">Service Orders</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{id}</li>
        </ol>
      </nav>

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="mb-4 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-md p-3 text-sm ${
                t.success
                  ? 'border border-green-300 bg-green-50 text-green-800'
                  : 'border border-destructive/30 bg-destructive/10 text-destructive'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Service Order #{id}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{so.supplier?.name ?? '—'}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATE_CLASSES[so.state] ?? 'bg-muted text-muted-foreground'
              }`}
            >
              {so.state}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canIssue && (
            <button
              onClick={() => issueMutation.mutate()}
              disabled={issueMutation.isPending}
              className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {issueMutation.isPending ? 'Issuing...' : 'Issue'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Cancel
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
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-semibold">Supplier</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{so.supplier?.name ?? '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-semibold">Warehouse</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{so.warehouse?.name ?? '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-semibold">Dates</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{so.creationDate?.substring(0, 10)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Requested By</dt>
                  <dd>{so.requestedByDate?.substring(0, 10) ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd>{so.issuedDate?.substring(0, 10) ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Received</dt>
                  <dd>{so.receivedDate?.substring(0, 10) ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment Term</dt>
                  <dd>{so.priceInfo?.paymentTerm ?? '—'}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd>${so.priceInfo?.total?.toFixed(2) ?? '0.00'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Carrier */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Carrier</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium">Carrier ID</label>
                <input
                  type="text"
                  value={carrierId || so.carrier?.id || ''}
                  onChange={(e) => setCarrierId(e.target.value)}
                  placeholder="Enter carrier ID..."
                  className={inputCls()}
                />
                {so.carrier?.name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {so.carrier.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCarrierMutation.mutate()}
                disabled={setCarrierMutation.isPending || !carrierId}
                className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                {setCarrierMutation.isPending ? 'Saving...' : 'Set Carrier'}
              </button>
            </div>
          </div>

          {/* Supplier Address form */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Supplier Address</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { field: 'companyName', label: 'Company' },
                  { field: 'contactName', label: 'Contact' },
                  { field: 'contactEmail', label: 'Email' },
                  { field: 'contactPhone', label: 'Phone' },
                  { field: 'street1', label: 'Street 1' },
                  { field: 'street2', label: 'Street 2' },
                  { field: 'city', label: 'City' },
                  { field: 'province', label: 'Province / State' },
                  { field: 'postalCode', label: 'Postal Code' },
                  { field: 'country', label: 'Country' },
                ] as { field: keyof Address; label: string }[]
              ).map(({ field, label }) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type="text"
                    value={(addressEdits[field] as string) ?? ''}
                    onChange={(e) => addressField(field, e.target.value)}
                    className={inputCls()}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveAddressMutation.mutate()}
                disabled={saveAddressMutation.isPending}
                className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                {saveAddressMutation.isPending ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEMS TAB ── */}
      {activeTab === 'items' && (
        <div>
          <div className="mb-3 flex justify-between">
            <h2 className="font-semibold">Items</h2>
            <button
              onClick={() => setInventoryModalOpen(true)}
              className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
            >
              + Add Item
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2">Tax</th>
                  <th className="px-4 py-2">Instructions</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {itemEdits.map((item, index) => (
                  <tr key={item.id || index} className="border-b">
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.productName}</div>
                      {item.lotSerial && (
                        <div className="font-mono text-xs text-muted-foreground">{item.lotSerial}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItemField(index, 'quantity', Number(e.target.value))}
                        className="w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItemField(index, 'unitPrice', Number(e.target.value))}
                        className="w-24 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.tax}
                        onChange={(e) => updateItemField(index, 'tax', e.target.value)}
                        className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">— None —</option>
                        {(taxes ?? []).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.instructions ?? ''}
                        onChange={(e) => updateItemField(index, 'instructions', e.target.value)}
                        className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Instructions..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-xs text-destructive hover:opacity-70"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {itemEdits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No items. Click &quot;+ Add Item&quot; to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => saveItemsMutation.mutate()}
              disabled={saveItemsMutation.isPending}
              className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {saveItemsMutation.isPending ? 'Saving...' : 'Save Items'}
            </button>
          </div>
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {activeTab === 'invoices' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Invoices</h2>
            <button
              onClick={() => setInvoiceModalOpen(true)}
              className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
            >
              + Add Invoice
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Invoice #</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {so.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{inv.id}</td>
                    <td className="px-4 py-2">{inv.creationDate?.substring(0, 10)}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${inv.priceInfo.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {so.invoices.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No invoices yet.
                    </td>
                  </tr>
                )}
                {so.invoices.length > 0 && (
                  <tr className="border-t bg-muted/20 font-semibold">
                    <td colSpan={2} className="px-4 py-2 text-right text-muted-foreground">
                      Invoice Total
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${invoiceTotal.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {activeTab === 'notes' && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 font-semibold">Notes</h2>
          {so.notes ? (
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{so.notes}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">No notes on this service order.</p>
          )}
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Print Service Order</h2>
              <button onClick={() => setPrintModalOpen(false)} className="text-muted-foreground hover:text-destructive">✕</button>
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
              <button
                onClick={() => setPrintModalOpen(false)}
                className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
              >
                Cancel
              </button>
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

      {/* ── INVENTORY SEARCH MODAL ── */}
      {inventoryModalOpen && (
        <InventorySearchModal
          taxes={taxes ?? []}
          onAdd={addNewItem}
          onClose={() => setInventoryModalOpen(false)}
        />
      )}

      {/* ── ADD INVOICE MODAL ── */}
      {invoiceModalOpen && (
        <AddInvoiceModal
          serviceOrderId={id!}
          onSuccess={() => {
            setInvoiceModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['service-order', id] })
          }}
          onClose={() => setInvoiceModalOpen(false)}
          addToast={addToast}
        />
      )}
    </div>
  )
}
