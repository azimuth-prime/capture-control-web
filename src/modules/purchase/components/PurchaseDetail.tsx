import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { Pagination } from '../../../shared/components/Pagination'
import type {
  PurchaseOrder,
  POState,
  POItem,
  RestockItem,
} from '../types'
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

type Tab = 'details' | 'items' | 'invoices' | 'receiving'

const STATE_CLASSES: Record<POState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  RECEIVING: 'bg-orange-100 text-orange-800',
  RECEIVED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETE: 'bg-green-100 text-green-800',
}

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function PurchaseDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('details')

  // Items tab state
  const [itemEdits, setItemEdits] = useState<Record<string, Partial<POItem>>>({})
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [addItemKeyword, setAddItemKeyword] = useState('')
  const [addItemPage, setAddItemPage] = useState(0)
  const debouncedAddItemKw = useDebounce(addItemKeyword, 300)

  // Receive modal state
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({})

  // Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceItemPrices, setInvoiceItemPrices] = useState<Record<string, number>>({})

  // Notes/carrier edit
  const [notesValue, setNotesValue] = useState('')
  const [carrierIdValue, setCarrierIdValue] = useState('')

  const { data: po, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  // Initialise editable fields once data arrives (only on first load)
  const [notesInitialised, setNotesInitialised] = useState(false)
  useEffect(() => {
    if (po && !notesInitialised) {
      setNotesValue(po.specialInstructions ?? '')
      setCarrierIdValue(po.carrier?.id ?? '')
      setNotesInitialised(true)
    }
  }, [po, notesInitialised])

  // Restock search for add-item modal
  const restockQuery = useQuery({
    queryKey: ['restock-search', debouncedAddItemKw, addItemPage],
    queryFn: () =>
      purchaseService.findRestockByKeyword({
        keyword: debouncedAddItemKw.length > 0 ? debouncedAddItemKw.toUpperCase() : '*',
        page: addItemPage,
        resultsPerPage: 10,
      }).then((r) => r.data),
    enabled: addItemModalOpen,
  })

  // Receivable items query — initialise receiveQtys when data arrives
  const receiveQuery = useQuery({
    queryKey: ['purchase-receive', id],
    queryFn: () => purchaseService.getPOForReceiving(id!).then((r) => r.data),
    enabled: receiveModalOpen,
  })

  useEffect(() => {
    if (receiveQuery.data && receiveModalOpen) {
      const qtys: Record<string, number> = {}
      for (const item of receiveQuery.data.items) {
        qtys[item.id] = item.toReceive
      }
      setReceiveQtys(qtys)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiveQuery.data])

  // Invoicable items query — initialise invoiceItemPrices when data arrives
  const invoicableQuery = useQuery({
    queryKey: ['purchase-invoicable', id],
    queryFn: () => purchaseService.findItemsForPOInvoice(id!).then((r) => r.data),
    enabled: invoiceModalOpen,
  })

  useEffect(() => {
    if (invoicableQuery.data && invoiceModalOpen) {
      const prices: Record<string, number> = {}
      for (const item of invoicableQuery.data) {
        prices[item.id] = item.unitPrice
      }
      setInvoiceItemPrices(prices)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicableQuery.data])

  // --- Mutations ---

  const issuePoMutation = useMutation<PurchaseOrder, { response?: { data?: ApiError } }>({
    mutationFn: () => purchaseService.issuePO(id!).then((r) => r.data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['purchase-order', id] })
      const previous = queryClient.getQueryData<PurchaseOrder>(['purchase-order', id])
      if (previous) {
        queryClient.setQueryData<PurchaseOrder>(['purchase-order', id], { ...previous, state: 'ISSUED' })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: PurchaseOrder } | undefined
      if (ctx?.previous) queryClient.setQueryData(['purchase-order', id], ctx.previous)
      addToast((_err as { response?: { data?: ApiError } }).response?.data?.errorMessage ?? 'Issue PO failed.', false)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['purchase-order', id], data)
      addToast('Purchase order issued.', true)
    },
  })

  const changeStateMutation = useMutation<PurchaseOrder, { response?: { data?: ApiError } }, POState>({
    mutationFn: (state) => purchaseService.changeState({ id: id!, state }).then((r) => r.data),
    onMutate: async (newState) => {
      await queryClient.cancelQueries({ queryKey: ['purchase-order', id] })
      const previous = queryClient.getQueryData<PurchaseOrder>(['purchase-order', id])
      if (previous) {
        queryClient.setQueryData<PurchaseOrder>(['purchase-order', id], { ...previous, state: newState })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: PurchaseOrder } | undefined
      if (ctx?.previous) queryClient.setQueryData(['purchase-order', id], ctx.previous)
      addToast((_err as { response?: { data?: ApiError } }).response?.data?.errorMessage ?? 'State change failed.', false)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['purchase-order', id], data)
      addToast(`State changed to: ${data.state}`, true)
    },
  })

  const saveItemsMutation = useMutation({
    mutationFn: () => {
      const items = (po?.items ?? []).map((item) => ({
        ...item,
        ...(itemEdits[item.id] ?? {}),
      }))
      return purchaseService.savePOItems({ purchaseOrderId: id!, items }).then((r) => r.data)
    },
    onSuccess: (data: PurchaseOrder) => {
      queryClient.setQueryData(['purchase-order', id], data)
      setItemEdits({})
      addToast('Items saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Save items failed.', false),
  })

  const addItemMutation = useMutation({
    mutationFn: (restockItem: RestockItem) => {
      const newItem: POItem = {
        id: '',
        skuId: restockItem.skuId,
        productId: restockItem.productId,
        productName: restockItem.productName,
        color: restockItem.color,
        size: restockItem.size,
        ordered: 1,
        approved: 0,
        received: 0,
        unitPrice: restockItem.unitCost ?? 0,
      }
      const existingItems = po?.items ?? []
      return purchaseService.savePOItems({
        purchaseOrderId: id!,
        items: [...existingItems, newItem],
      }).then((r) => r.data)
    },
    onSuccess: (data: PurchaseOrder) => {
      queryClient.setQueryData(['purchase-order', id], data)
      setAddItemModalOpen(false)
      setAddItemKeyword('')
      addToast('Item added.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Add item failed.', false),
  })

  const receiveStockMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(receiveQtys).map(([itemId, quantity]) => {
        const receiveItem = receiveQuery.data?.items.find((i) => i.id === itemId)
        return { id: itemId, skuId: receiveItem?.skuId ?? '', quantity }
      })
      return purchaseService.receiveStock({ purchaseOrderId: id!, items }).then((r) => r.data)
    },
    onSuccess: (data: PurchaseOrder) => {
      queryClient.setQueryData(['purchase-order', id], data)
      setReceiveModalOpen(false)
      addToast('Stock received.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Receive stock failed.', false),
  })

  const addInvoiceMutation = useMutation({
    mutationFn: () => {
      const items = (invoicableQuery.data ?? []).map((item) => ({
        ...item,
        unitPrice: invoiceItemPrices[item.id] ?? item.unitPrice,
      }))
      return purchaseService.addInvoice({ purchaseOrderId: id!, items }).then((r) => r.data)
    },
    onSuccess: (data: PurchaseOrder) => {
      queryClient.setQueryData(['purchase-order', id], data)
      setInvoiceModalOpen(false)
      addToast('Invoice added.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Add invoice failed.', false),
  })

  const printMutation = useMutation({
    mutationFn: () => purchaseService.printPurchaseOrder(id!).then((r) => r.data),
    onSuccess: () => addToast('Sent to printer.', true),
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Print failed.', false),
  })

  const downloadMutation = useMutation({
    mutationFn: () => purchaseService.downloadPOPDF(id!).then((r) => r.data),
    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PurchaseOrder#${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Download failed.', false),
  })

  const setCarrierMutation = useMutation({
    mutationFn: () => purchaseService.setCarrier({ id: id!, carrierId: carrierIdValue }).then((r) => r.data),
    onSuccess: (data: PurchaseOrder) => {
      queryClient.setQueryData(['purchase-order', id], data)
      addToast('Carrier updated.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Set carrier failed.', false),
  })

  function setItemEdit(itemId: string, field: keyof POItem, value: string | number) {
    setItemEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  function getItemValue<K extends keyof POItem>(item: POItem, field: K): POItem[K] {
    const edit = itemEdits[item.id]
    if (edit && field in edit) return (edit as Record<string, unknown>)[field as string] as POItem[K]
    return item[field]
  }

  if (isLoading) return <LoadingSpinner message="Loading purchase order..." />
  if (isError) return <ErrorMessage title="Failed to load purchase order" message={(error as Error).message} onRetry={refetch} />
  if (!po) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'items', label: `Items (${po.items.length})` },
    { id: 'invoices', label: `Invoices (${po.invoices.length})` },
    { id: 'receiving', label: 'Receiving' },
  ]

  const canIssue = po.state === 'SUBMITTED'
  const canCancel = po.state !== 'CANCELLED' && po.state !== 'COMPLETE' && po.state !== 'RECEIVED'
  const canReceive = po.state === 'ISSUED' || po.state === 'RECEIVING'
  const canAddInvoice = po.state === 'RECEIVED' || po.state === 'COMPLETE'

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/purchase" className="hover:underline">Purchase Orders</Link></li>
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
          <h1 className="text-xl font-semibold">Purchase Order #{po.poNumber ?? id}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_CLASSES[po.state]}`}>
              {po.state}
            </span>
            <span className="text-sm text-muted-foreground">{po.supplier?.name}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canIssue && (
            <button
              onClick={() => issuePoMutation.mutate()}
              disabled={issuePoMutation.isPending}
              className="rounded border border-blue-600 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            >
              {issuePoMutation.isPending ? 'Issuing...' : 'Issue PO'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => changeStateMutation.mutate('CANCELLED')}
              disabled={changeStateMutation.isPending}
              className="rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              Cancel
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => setReceiveModalOpen(true)}
              className="rounded border border-teal-600 px-3 py-1.5 text-sm text-teal-700 hover:bg-teal-50"
            >
              Receive Stock
            </button>
          )}
          {canAddInvoice && (
            <button
              onClick={() => setInvoiceModalOpen(true)}
              className="rounded border border-purple-600 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50"
            >
              Add Invoice
            </button>
          )}
          <button
            onClick={() => printMutation.mutate()}
            disabled={printMutation.isPending}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
          >
            Print PO
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
      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-t border px-4 py-1.5 text-sm ${
              activeTab === t.id ? 'border-b-white bg-white font-medium' : 'hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Supplier &amp; Warehouse</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Supplier</dt>
                <dd>{po.supplier?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Warehouse</dt>
                <dd>{po.warehouse?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment Term</dt>
                <dd>{po.priceInfo?.paymentTerm ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-mono">${(po.priceInfo?.total ?? 0).toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Dates</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{po.creationDate?.substring(0, 10) ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Requested By</dt>
                <dd>{po.requestedByDate?.substring(0, 10) ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issue Date</dt>
                <dd>{po.issueDate?.substring(0, 10) ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Received Date</dt>
                <dd>{po.receivedDate?.substring(0, 10) ?? '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-4 lg:col-span-2">
            <h2 className="mb-3 font-semibold">Notes &amp; Carrier</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Special Instructions</label>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={3}
                  className={inputCls()}
                  placeholder="Enter special instructions..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Carrier ID</label>
                <input
                  type="text"
                  value={carrierIdValue}
                  onChange={(e) => setCarrierIdValue(e.target.value)}
                  className={inputCls()}
                  placeholder="Enter carrier ID..."
                />
                <button
                  onClick={() => setCarrierMutation.mutate()}
                  disabled={setCarrierMutation.isPending || !carrierIdValue.trim()}
                  className="mt-2 rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {setCarrierMutation.isPending ? 'Saving...' : 'Set Carrier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEMS TAB ── */}
      {activeTab === 'items' && (
        <div>
          <div className="mb-3 flex justify-end gap-2">
            <button
              onClick={() => setAddItemModalOpen(true)}
              className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
            >
              Add Item
            </button>
            <button
              onClick={() => saveItemsMutation.mutate()}
              disabled={saveItemsMutation.isPending || Object.keys(itemEdits).length === 0}
              className="rounded border border-blue-600 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            >
              {saveItemsMutation.isPending ? 'Saving...' : 'Save Items'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Color / Size</th>
                  <th className="px-4 py-2 text-right">Ordered</th>
                  <th className="px-4 py-2 text-right">Approved</th>
                  <th className="px-4 py-2 text-right">Received</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2">Tax</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {[item.color, item.size].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={getItemValue(item, 'ordered') as number}
                        onChange={(e) => setItemEdit(item.id, 'ordered', Number(e.target.value))}
                        className="w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={getItemValue(item, 'approved') as number}
                        onChange={(e) => setItemEdit(item.id, 'approved', Number(e.target.value))}
                        className="w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{item.received}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={getItemValue(item, 'unitPrice') as number}
                        onChange={(e) => setItemEdit(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-24 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={(getItemValue(item, 'tax') as string) ?? ''}
                        onChange={(e) => setItemEdit(item.id, 'tax', e.target.value)}
                        className="w-20 rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                  </tr>
                ))}
                {po.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No items. Click "Add Item" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {activeTab === 'invoices' && (
        <div>
          <div className="mb-3 flex justify-end">
            {canAddInvoice && (
              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="rounded border border-purple-600 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50"
              >
                Add Invoice
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Invoice ID</th>
                  <th className="px-4 py-2">State</th>
                  <th className="px-4 py-2">Invoice Date</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {po.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono text-xs">{inv.id}</td>
                    <td className="px-4 py-2">{inv.state}</td>
                    <td className="px-4 py-2">{inv.invoiceDate?.substring(0, 10) ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-mono">${(inv.total ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
                {po.invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RECEIVING TAB ── */}
      {activeTab === 'receiving' && (
        <div>
          <div className="mb-4 rounded-lg border bg-card p-4">
            <h2 className="mb-2 font-semibold">Receiving Status</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">State</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_CLASSES[po.state]}`}>
                    {po.state}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Received Date</dt>
                <dd>{po.receivedDate?.substring(0, 10) ?? '—'}</dd>
              </div>
            </dl>
            {canReceive && (
              <div className="mt-4">
                <button
                  onClick={() => setReceiveModalOpen(true)}
                  className="rounded border border-teal-600 px-3 py-1.5 text-sm text-teal-700 hover:bg-teal-50"
                >
                  Receive Stock
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Ordered</th>
                  <th className="px-4 py-2 text-right">Approved</th>
                  <th className="px-4 py-2 text-right">Received</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">
                      <div>{item.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {[item.color, item.size].filter(Boolean).join(' / ')}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">{item.ordered}</td>
                    <td className="px-4 py-2 text-right">{item.approved}</td>
                    <td className="px-4 py-2 text-right">{item.received}</td>
                  </tr>
                ))}
                {po.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No items.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD ITEM MODAL ── */}
      {addItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Item</h2>
              <button onClick={() => setAddItemModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={addItemKeyword}
              onChange={(e) => { setAddItemKeyword(e.target.value); setAddItemPage(0) }}
              className="mb-4 w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {restockQuery.isLoading && <LoadingSpinner message="Searching..." />}
            {restockQuery.data && (
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
                      {restockQuery.data.results.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-muted/40">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(' / ') || '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {item.unitCost != null ? `$${item.unitCost.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => addItemMutation.mutate(item)}
                              disabled={addItemMutation.isPending}
                              className="rounded border border-green-600 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                      {restockQuery.data.results.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No results.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <Pagination
                    page={restockQuery.data.page}
                    pages={restockQuery.data.pages}
                    hasNext={restockQuery.data.hasNext}
                    hasPrevious={restockQuery.data.hasPrevious}
                    onPageChange={setAddItemPage}
                  />
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setAddItemModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE STOCK MODAL ── */}
      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Receive Stock</h2>
              <button onClick={() => setReceiveModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {receiveQuery.isLoading && <LoadingSpinner message="Loading receivable items..." />}
            {receiveQuery.isError && (
              <ErrorMessage message={(receiveQuery.error as Error).message} />
            )}
            {receiveQuery.data && (
              <>
                <div className="max-h-80 overflow-y-auto rounded border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 text-right">Ordered</th>
                        <th className="px-4 py-2 text-right">Already Received</th>
                        <th className="px-4 py-2 text-right">To Receive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveQuery.data.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">
                            <div>{item.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">{item.ordered}</td>
                          <td className="px-4 py-2 text-right">{item.received}</td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={item.ordered - item.received}
                              value={receiveQtys[item.id] ?? 0}
                              onChange={(e) =>
                                setReceiveQtys((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                              }
                              className="w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setReceiveModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
                    Cancel
                  </button>
                  <button
                    onClick={() => receiveStockMutation.mutate()}
                    disabled={receiveStockMutation.isPending}
                    className="rounded border border-teal-600 px-4 py-1.5 text-sm text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                  >
                    {receiveStockMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD INVOICE MODAL ── */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Invoice</h2>
              <button onClick={() => setInvoiceModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {invoicableQuery.isLoading && <LoadingSpinner message="Loading invoicable items..." />}
            {invoicableQuery.isError && (
              <ErrorMessage message={(invoicableQuery.error as Error).message} />
            )}
            {invoicableQuery.data && (
              <>
                <div className="max-h-80 overflow-y-auto rounded border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 text-right">Ordered</th>
                        <th className="px-4 py-2 text-right">Approved</th>
                        <th className="px-4 py-2 text-right">Received</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicableQuery.data.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2">{item.productName}</td>
                          <td className="px-4 py-2 text-right">{item.ordered}</td>
                          <td className="px-4 py-2 text-right">{item.approved}</td>
                          <td className="px-4 py-2 text-right">{item.received}</td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={invoiceItemPrices[item.id] ?? item.unitPrice}
                              onChange={(e) =>
                                setInvoiceItemPrices((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                              }
                              className="w-24 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                        </tr>
                      ))}
                      {invoicableQuery.data.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                            No invoicable items.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setInvoiceModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">
                    Cancel
                  </button>
                  <button
                    onClick={() => addInvoiceMutation.mutate()}
                    disabled={addInvoiceMutation.isPending || invoicableQuery.data.length === 0}
                    className="rounded border border-purple-600 px-4 py-1.5 text-sm text-purple-700 hover:bg-purple-50 disabled:opacity-40"
                  >
                    {addInvoiceMutation.isPending ? 'Adding...' : 'Add Invoice'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
