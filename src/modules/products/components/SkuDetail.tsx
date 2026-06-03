import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skuService } from '../services/skuService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import type {
  SKU,
  SKUDimensions,
  CreateInventoryRequest,
  PrintLabelRequest,
} from '../types'
import type { ApiError } from '../../../shared/types'

let toastCounter = 0

export function SkuDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'main' | 'inventory' | 'media' | 'dimensions' | 'suppliers' | 'sales'>('main')
  const [toast, setToast] = useState<{ id: number; message: string; success: boolean } | null>(null)
  const [showNewLotModal, setShowNewLotModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [newLot, setNewLot] = useState<Partial<CreateInventoryRequest>>({ state: 'ACTIVE' })
  const [printLabel, setPrintLabel] = useState<PrintLabelRequest>({ inventoryId: '', productLabelQty: 1, rfidLabelQty: 0 })
  const [salesPage, setSalesPage] = useState(0)

  function showToast(message: string, success: boolean) {
    const tid = ++toastCounter
    setToast({ id: tid, message, success })
    setTimeout(() => setToast((t) => (t?.id === tid ? null : t)), 4000)
  }

  const { data: sku, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['sku', id],
    queryFn: () => skuService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: skuConfig } = useQuery({
    queryKey: ['sku-config'],
    queryFn: () => skuService.findSkuConfig().then((r) => r.data),
  })

  const { data: inventory } = useQuery({
    queryKey: ['sku-inventory', id],
    queryFn: () => skuService.findInventoryBySkuId(id!).then((r) => r.data),
    enabled: !!id && tab === 'inventory',
  })

  const { data: sales } = useQuery({
    queryKey: ['sku-sales', id, salesPage],
    queryFn: () =>
      skuService.findSkuSales({ keyword: id!, page: salesPage, resultsPerPage: 30 }).then((r) => r.data),
    enabled: !!id && tab === 'sales',
  })

  const saveSkuMutation = useMutation({
    mutationFn: (data: Partial<SKU>) =>
      skuService.saveSku({ ...data, id: id! }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('SKU saved.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to save SKU.', false),
  })

  const saveDimensionsMutation = useMutation({
    mutationFn: (data: SKUDimensions) => skuService.saveSkuDimensions(id!, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Dimensions saved.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to save dimensions.', false),
  })

  const createInventoryMutation = useMutation({
    mutationFn: () =>
      skuService.createInventory({ ...newLot, skuId: id! } as CreateInventoryRequest).then((r) => r.data),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['sku-inventory', id] })
      setShowNewLotModal(false)
      setNewLot({ state: 'ACTIVE' })
      showToast(`Lot/Serial ${inv.lotSerial ?? inv.id} created.`, true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to create lot.', false),
  })

  const printLabelsMutation = useMutation({
    mutationFn: () => skuService.printLabels(printLabel),
    onSuccess: () => {
      setShowPrintModal(false)
      showToast('Labels sent to printer.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Print failed.', false),
  })

  const uploadMediaMutation = useMutation({
    mutationFn: (file: File) => skuService.uploadSkuMedia(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Media uploaded.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Upload failed.', false),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => skuService.deleteSkuMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Media removed.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Delete failed.', false),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !sku)
    return (
      <ErrorMessage
        message={(error as unknown as ApiError)?.errorMessage ?? 'SKU not found.'}
        onRetry={refetch}
      />
    )

  const isSimple = sku.skuType === 'SIMPLESKU'

  return (
    <div className="p-4">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded p-3 text-sm text-white ${toast.success ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <Link to={`/products/${sku.productId}`} className="text-sm text-blue-600 hover:underline">
          ← {sku.productName ?? 'Product'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">SKU: {sku.id}</h1>
        <p className="text-sm text-muted-foreground">
          {sku.colorSwatch?.name ?? ''} {sku.sizing?.name ?? ''}
        </p>
      </div>

      {/* Stock count cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            { label: 'On Hand', value: sku.stockCount.onHand },
            { label: 'Available', value: sku.stockCount.available },
            { label: 'Ordered', value: sku.stockCount.ordered },
            { label: 'Backordered', value: sku.stockCount.backordered },
            { label: 'On PO', value: sku.stockCount.onPO },
            { label: 'Out for Service', value: sku.stockCount.outForService ?? 0 },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} className="rounded border p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-green-600">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b">
        <button
          onClick={() => setTab('main')}
          className={`px-4 py-2 text-sm ${tab === 'main' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
        >
          Main
        </button>
        {isSimple && (
          <>
            <button
              onClick={() => setTab('inventory')}
              className={`px-4 py-2 text-sm ${tab === 'inventory' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            >
              Inventory Lots
            </button>
            <button
              onClick={() => setTab('media')}
              className={`px-4 py-2 text-sm ${tab === 'media' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            >
              Media
            </button>
          </>
        )}
        <button
          onClick={() => setTab('dimensions')}
          className={`px-4 py-2 text-sm ${tab === 'dimensions' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
        >
          Weight &amp; Dimensions
        </button>
        {isSimple && (
          <>
            <button
              onClick={() => setTab('suppliers')}
              className={`px-4 py-2 text-sm ${tab === 'suppliers' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setTab('sales')}
              className={`px-4 py-2 text-sm ${tab === 'sales' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            >
              Sales History
            </button>
          </>
        )}
      </div>

      {/* Main tab */}
      {tab === 'main' && (
        <SkuMainTab sku={sku} onSave={(data) => saveSkuMutation.mutate(data)} isSaving={saveSkuMutation.isPending} />
      )}

      {/* Inventory Lots tab */}
      {tab === 'inventory' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Inventory Lots / Serials</h2>
            <button
              onClick={() => { setNewLot({ state: 'ACTIVE' }); setShowNewLotModal(true) }}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
            >
              New Lot
            </button>
          </div>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Lot / Serial</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2">Expiry</th>
                  <th className="px-3 py-2 text-right">On Hand</th>
                  <th className="px-3 py-2 text-right">Available</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(inventory ?? []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/skus/inventory/${inv.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {inv.lotSerial ?? inv.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{inv.state}</td>
                    <td className="px-3 py-2">{inv.warehouse.name}</td>
                    <td className="px-3 py-2">{inv.receivedDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2">{inv.expiryDate?.slice(0, 10) ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{inv.stockCount?.onHand ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{inv.stockCount?.available ?? '—'}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => {
                          setPrintLabel({ inventoryId: inv.id, productLabelQty: 1, rfidLabelQty: 0 })
                          setShowPrintModal(true)
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
                {(inventory ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      No inventory lots.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Media tab */}
      {tab === 'media' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">SKU Media</h2>
            <label className="cursor-pointer rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMediaMutation.mutate(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(sku.media ?? []).map((m) => (
              <div key={m.id} className="relative rounded border p-1">
                <img src={m.url} alt="" className="h-32 w-full rounded object-cover" />
                <button
                  onClick={() => deleteMediaMutation.mutate(m.id)}
                  className="absolute right-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            {(sku.media ?? []).length === 0 && (
              <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">
                No media uploaded.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dimensions tab */}
      {tab === 'dimensions' && (
        <DimensionsTab
          dimensions={sku.dimensions}
          onSave={(data) => saveDimensionsMutation.mutate(data)}
          isSaving={saveDimensionsMutation.isPending}
        />
      )}

      {/* Suppliers tab */}
      {tab === 'suppliers' && (
        <div>
          <h2 className="mb-3 font-medium">Supplier Pricing</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Vendor Product ID</th>
                  <th className="px-3 py-2">Vendor SKU ID</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-right">Lead Time (days)</th>
                  <th className="px-3 py-2">Stock Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(sku.vendors ?? []).map((v) => (
                  <tr key={v.supplierId} className="hover:bg-muted/50">
                    <td className="px-3 py-2">{v.supplierName ?? v.supplierId}</td>
                    <td className="px-3 py-2">{v.vendorProductId ?? '—'}</td>
                    <td className="px-3 py-2">{v.vendorSkuId ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {v.unitCost != null ? `$${v.unitCost.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">{v.leadTime ?? '—'}</td>
                    <td className="px-3 py-2">{v.stockUnit ?? '—'}</td>
                  </tr>
                ))}
                {(sku.vendors ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No supplier pricing configured. Add via Vendor Price Lists.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales History tab */}
      {tab === 'sales' && (
        <div>
          <h2 className="mb-3 font-medium">Sales History</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(sales?.results ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">
                      <Link to={`/order/${s.orderId}`} className="text-blue-600 hover:underline">
                        {s.orderId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{s.date?.slice(0, 10)}</td>
                    <td className="px-3 py-2">{s.customerName ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{s.quantity}</td>
                  </tr>
                ))}
                {(sales?.results ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No sales history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {sales && (
            <div className="mt-3">
              <Pagination
                page={salesPage}
                pages={Math.min(sales.pages, 20)}
                hasNext={sales.hasNext}
                hasPrevious={sales.hasPrevious}
                onPageChange={setSalesPage}
              />
            </div>
          )}
        </div>
      )}

      {/* New Lot modal */}
      {showNewLotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New Lot / Serial</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Lot / Serial Number</label>
                <input
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={newLot.lotSerial ?? ''}
                  onChange={(e) => setNewLot((l) => ({ ...l, lotSerial: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Warehouse</label>
                <select
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={newLot.warehouse?.id ?? ''}
                  onChange={(e) => {
                    const wh = skuConfig?.warehouses.find((w) => w.id === e.target.value)
                    if (wh) setNewLot((l) => ({ ...l, warehouse: wh }))
                  }}
                >
                  <option value="">Select warehouse</option>
                  {skuConfig?.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Received Date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={newLot.receivedDate ?? ''}
                    onChange={(e) => setNewLot((l) => ({ ...l, receivedDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={newLot.expiryDate ?? ''}
                    onChange={(e) => setNewLot((l) => ({ ...l, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowNewLotModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => createInventoryMutation.mutate()}
                disabled={createInventoryMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {createInventoryMutation.isPending ? 'Creating...' : 'Create Lot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Labels modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Print Labels</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Product Labels</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={printLabel.productLabelQty}
                  onChange={(e) =>
                    setPrintLabel((p) => ({ ...p, productLabelQty: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">RFID Labels</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={printLabel.rfidLabelQty ?? 0}
                  onChange={(e) =>
                    setPrintLabel((p) => ({ ...p, rfidLabelQty: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => printLabelsMutation.mutate()}
                disabled={printLabelsMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {printLabelsMutation.isPending ? 'Printing...' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SkuMainTabProps {
  sku: SKU
  onSave: (data: Partial<SKU>) => void
  isSaving: boolean
}

function SkuMainTab({ sku, onSave, isSaving }: SkuMainTabProps) {
  const [form, setForm] = useState<Partial<SKU>>({
    inventoryType: sku.inventoryType,
    controlType: sku.controlType,
    availabilityDate: sku.availabilityDate ?? '',
    stockThreshold: sku.stockThreshold ?? -1,
    upc: sku.upc ?? '',
  })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">SKU ID</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.id}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Product ID</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.productId}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Inventory Type</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.inventoryType}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Control Type</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.controlType ?? '—'}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Color</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.colorSwatch?.name ?? '—'}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Size</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.sizing?.name ?? '—'}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Availability Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={typeof form.availabilityDate === 'string' ? form.availabilityDate : ''}
            onChange={(e) => setForm((f) => ({ ...f, availabilityDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stock Threshold</label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.stockThreshold ?? -1}
            onChange={(e) => setForm((f) => ({ ...f, stockThreshold: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">UPC</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.upc ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, upc: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">SKU Type</label>
          <input
            readOnly
            className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
            value={sku.skuType}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Created: </span>
          {sku.creationDate?.slice(0, 10) ?? '—'}
        </div>
        <div>
          <span className="font-medium">Modified: </span>
          {sku.lastModifiedDate?.slice(0, 10) ?? '—'}
        </div>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={isSaving}
        className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

interface DimensionsTabProps {
  dimensions: SKUDimensions | undefined
  onSave: (data: SKUDimensions) => void
  isSaving: boolean
}

function DimensionsTab({ dimensions, onSave, isSaving }: DimensionsTabProps) {
  const [form, setForm] = useState<SKUDimensions>(
    dimensions ?? { weight: 0, length: 0, width: 0, height: 0, weightUnit: 'LB', dimensionUnit: 'IN' },
  )

  return (
    <div className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Weight</label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.weight ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Weight Unit</label>
          <select
            className="w-full rounded border px-2 py-1.5 text-sm"
            value={form.weightUnit ?? 'LB'}
            onChange={(e) => setForm((f) => ({ ...f, weightUnit: e.target.value }))}
          >
            {['LB', 'KG', 'OZ', 'G'].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Length</label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.length ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Width</label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.width ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Height</label>
          <input
            type="number"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.height ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Dimension Unit</label>
        <select
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={form.dimensionUnit ?? 'IN'}
          onChange={(e) => setForm((f) => ({ ...f, dimensionUnit: e.target.value }))}
        >
          {['IN', 'CM', 'MM', 'FT'].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => onSave(form)}
        disabled={isSaving}
        className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Dimensions'}
      </button>
    </div>
  )
}
