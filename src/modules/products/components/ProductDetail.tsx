import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productService'
import { skuService } from '../services/skuService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type {
  Product,
  ProductType,
  ControlType,
  InventoryType,
  SKUSummary,
} from '../types'
import type { ApiError } from '../../../shared/types'

const PRODUCT_TYPES: ProductType[] = ['FINISHED', 'COMPONENT', 'SERVICE', 'OTHER']
const CONTROL_TYPES: ControlType[] = ['LOT', 'SERIAL']
const INVENTORY_TYPES: InventoryType[] = ['INVENTORIED', 'DROPSHIP', 'INFINITE']

let toastCounter = 0

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'main' | 'skus' | 'config'>('main')
  const [toast, setToast] = useState<{ id: number; message: string; success: boolean } | null>(
    null,
  )
  const [showNewSkuModal, setShowNewSkuModal] = useState(false)
  const [newSku, setNewSku] = useState({
    inventoryType: 'INVENTORIED' as InventoryType,
    controlType: 'LOT' as ControlType,
    colorSwatchId: '',
    sizingId: '',
    availabilityDate: '',
    stockThreshold: -1,
  })

  function showToast(message: string, success: boolean) {
    const tid = ++toastCounter
    setToast({ id: tid, message, success })
    setTimeout(() => setToast((t) => (t?.id === tid ? null : t)), 4000)
  }

  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: skuConfig } = useQuery({
    queryKey: ['sku-config'],
    queryFn: () => skuService.findSkuConfig().then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Product>) =>
      productService.save({ ...data, id: id! }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      showToast('Product saved.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to save product.', false),
  })

  const createSkuMutation = useMutation({
    mutationFn: () => {
      const colorSwatch = skuConfig?.colorSwatches.find((c) => c.id === newSku.colorSwatchId)
      const sizing = skuConfig?.sizings.find((s) => s.id === newSku.sizingId)
      return skuService
        .saveSku({
          productId: id!,
          inventoryType: newSku.inventoryType,
          controlType: newSku.controlType,
          colorSwatch,
          sizing,
          availabilityDate: newSku.availabilityDate || null,
          stockThreshold: newSku.stockThreshold,
        })
        .then((r) => r.data)
    },
    onSuccess: (sku) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      setShowNewSkuModal(false)
      showToast(`SKU ${sku.id} created.`, true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to create SKU.', false),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !product)
    return (
      <ErrorMessage
        message={(error as unknown as ApiError)?.errorMessage ?? 'Product not found.'}
        onRetry={refetch}
      />
    )

  return (
    <div className="p-4">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded p-3 text-sm text-white ${toast.success ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-4">
        <Link to="/products" className="text-sm text-blue-600 hover:underline">
          ← Products
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
        <p className="font-mono text-xs text-muted-foreground">{product.id}</p>
      </div>

      <div className="mb-4 border-b">
        {(
          [
            { key: 'main', label: 'Main' },
            { key: 'skus', label: 'SKUs' },
            { key: 'config', label: 'Config' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm ${tab === key ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <MainTab product={product} onSave={(data) => saveMutation.mutate(data)} isSaving={saveMutation.isPending} />
      )}
      {tab === 'skus' && (
        <SkusTab skus={product.skus ?? []} onNewSku={() => setShowNewSkuModal(true)} />
      )}
      {tab === 'config' && (
        <ConfigTab productId={id!} showToast={showToast} />
      )}

      {showNewSkuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New SKU</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Inventory Type</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newSku.inventoryType}
                    onChange={(e) =>
                      setNewSku((s) => ({ ...s, inventoryType: e.target.value as InventoryType }))
                    }
                  >
                    {INVENTORY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Control Type</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newSku.controlType}
                    onChange={(e) =>
                      setNewSku((s) => ({ ...s, controlType: e.target.value as ControlType }))
                    }
                  >
                    {CONTROL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Color</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newSku.colorSwatchId}
                    onChange={(e) => setNewSku((s) => ({ ...s, colorSwatchId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {skuConfig?.colorSwatches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Size</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newSku.sizingId}
                    onChange={(e) => setNewSku((s) => ({ ...s, sizingId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {skuConfig?.sizings.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Availability Date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={newSku.availabilityDate}
                    onChange={(e) =>
                      setNewSku((s) => ({ ...s, availabilityDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock Threshold</label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={newSku.stockThreshold}
                    onChange={(e) =>
                      setNewSku((s) => ({ ...s, stockThreshold: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowNewSkuModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => createSkuMutation.mutate()}
                disabled={createSkuMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {createSkuMutation.isPending ? 'Creating...' : 'Create SKU'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-tabs ─────────────────────────────────────────────────────────────────

interface MainTabProps {
  product: Product
  onSave: (data: Partial<Product>) => void
  isSaving: boolean
}

function MainTab({ product, onSave, isSaving }: MainTabProps) {
  const [form, setForm] = useState<Partial<Product>>({
    name: product.name,
    description: product.description ?? '',
    altId: product.altId ?? '',
    productType: product.productType,
    controlType: product.controlType,
    availabilityDate: product.availabilityDate ?? '',
    taxable: product.taxable ?? false,
    stockUnit: product.stockUnit ?? '',
    manufacturer: product.manufacturer ?? {},
  })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Alt ID</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.altId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, altId: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border px-3 py-1.5 text-sm"
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Product Type</label>
          <select
            className="w-full rounded border px-2 py-1.5 text-sm"
            value={form.productType ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, productType: e.target.value as ProductType }))
            }
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Control Type</label>
          <select
            className="w-full rounded border px-2 py-1.5 text-sm"
            value={form.controlType ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, controlType: e.target.value as ControlType }))
            }
          >
            {CONTROL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
          <label className="mb-1 block text-sm font-medium">Stock Unit</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.stockUnit ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, stockUnit: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Manufacturer Name</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.manufacturer?.name ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, manufacturer: { ...f.manufacturer, name: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Manufacturer Product ID</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.manufacturer?.productId ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                manufacturer: { ...f.manufacturer, productId: e.target.value },
              }))
            }
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="taxable"
          checked={form.taxable ?? false}
          onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.checked }))}
        />
        <label htmlFor="taxable" className="text-sm">
          Taxable
        </label>
      </div>
      {product.taxes && product.taxes.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">Applied Taxes</label>
          <p className="text-sm text-muted-foreground">{product.taxes.join(', ')}</p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

interface SkusTabProps {
  skus: SKUSummary[]
  onNewSku: () => void
}

function SkusTab({ skus, onNewSku }: SkusTabProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">SKUs ({skus.length})</h2>
        <button
          onClick={onNewSku}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          New SKU
        </button>
      </div>
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">SKU ID</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Available</th>
              <th className="px-3 py-2 text-right">On Hand</th>
              <th className="px-3 py-2 text-right">Ordered</th>
              <th className="px-3 py-2 text-right">Backordered</th>
              <th className="px-3 py-2 text-right">On PO</th>
              <th className="px-3 py-2">Warehouses</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {skus.map((s) => (
              <tr key={s.id} className="hover:bg-muted/50">
                <td className="px-3 py-2">
                  <Link
                    to={`/products/skus/${s.id}`}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {s.id}
                  </Link>
                </td>
                <td className="px-3 py-2">{s.color ?? '—'}</td>
                <td className="px-3 py-2">{s.size ?? '—'}</td>
                <td className="px-3 py-2">{s.inventoryType ?? '—'}</td>
                <td className="px-3 py-2 text-right">{s.stockCount.available.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{s.stockCount.onHand.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{s.stockCount.ordered.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  {s.stockCount.backordered.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">{s.stockCount.onPO.toLocaleString()}</td>
                <td className="px-3 py-2">{s.warehouses?.join(', ') ?? '—'}</td>
              </tr>
            ))}
            {skus.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  No SKUs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ConfigTabProps {
  productId: string
  showToast: (message: string, success: boolean) => void
}

function ConfigTab({ productId, showToast }: ConfigTabProps) {
  const queryClient = useQueryClient()
  const [newStockUnit, setNewStockUnit] = useState('')

  const { data: stockUnit } = useQuery({
    queryKey: ['stock-unit', productId],
    queryFn: () => productService.findStockUnitById(productId).then((r) => r.data),
    enabled: !!productId,
  })

  const saveStockUnitMutation = useMutation({
    mutationFn: () =>
      productService.saveStockUnit({ id: productId, name: newStockUnit }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-unit', productId] })
      setNewStockUnit('')
      showToast('Stock unit saved.', true)
    },
    onError: (err: ApiError) =>
      showToast(err.errorMessage ?? 'Failed to save stock unit.', false),
  })

  const deleteStockUnitMutation = useMutation({
    mutationFn: () => productService.deleteStockUnit(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-unit', productId] })
      showToast('Stock unit removed.', true)
    },
    onError: (err: ApiError) =>
      showToast(err.errorMessage ?? 'Failed to remove stock unit.', false),
  })

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h3 className="mb-2 font-medium">Stock Unit</h3>
        {stockUnit ? (
          <div className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
            <span className="flex-1">{stockUnit.name}</span>
            <button
              onClick={() => deleteStockUnitMutation.mutate()}
              disabled={deleteStockUnitMutation.isPending}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border px-3 py-1.5 text-sm"
              placeholder="Stock unit name (e.g. EACH, BOX)"
              value={newStockUnit}
              onChange={(e) => setNewStockUnit(e.target.value)}
            />
            <button
              onClick={() => saveStockUnitMutation.mutate()}
              disabled={!newStockUnit || saveStockUnitMutation.isPending}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
