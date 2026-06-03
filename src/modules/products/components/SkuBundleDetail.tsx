import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skuService } from '../services/skuService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { SKU, SKUDimensions, SKUComponent } from '../types'
import type { ApiError } from '../../../shared/types'
import { useDebounce } from '../../../shared/hooks/useDebounce'

let toastCounter = 0

export function SkuBundleDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'main' | 'components' | 'dimensions'>('main')
  const [toast, setToast] = useState<{ id: number; message: string; success: boolean } | null>(null)
  const [componentSearch, setComponentSearch] = useState('')
  const debouncedSearch = useDebounce(componentSearch, 300)
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState('')
  const [componentQty, setComponentQty] = useState(1)

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

  const { data: componentResults } = useQuery({
    queryKey: ['sku-component-search', debouncedSearch],
    queryFn: () =>
      skuService.findComponentSkuByKeyword({ keyword: debouncedSearch }).then((r) => r.data),
    enabled: showAddComponent && debouncedSearch.length > 1,
  })

  const saveSkuMutation = useMutation({
    mutationFn: (data: Partial<SKU>) =>
      skuService.saveSku({ ...data, id: id! }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Bundle saved.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to save.', false),
  })

  const saveDimensionsMutation = useMutation({
    mutationFn: (data: SKUDimensions) =>
      skuService.saveSkuDimensions(id!, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Dimensions saved.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to save.', false),
  })

  const addComponentMutation = useMutation({
    mutationFn: () => {
      const updated = [
        ...(sku?.components ?? []),
        { componentSkuId: selectedComponentId, quantity: componentQty } as SKUComponent,
      ]
      return skuService.saveSku({ id: id!, components: updated }).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      setShowAddComponent(false)
      setComponentSearch('')
      setSelectedComponentId('')
      setComponentQty(1)
      showToast('Component added.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to add component.', false),
  })

  const removeComponentMutation = useMutation({
    mutationFn: (componentSkuId: string) => {
      const updated = (sku?.components ?? []).filter((c) => c.componentSkuId !== componentSkuId)
      return skuService.saveSku({ id: id!, components: updated }).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku', id] })
      showToast('Component removed.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to remove.', false),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !sku)
    return (
      <ErrorMessage
        message={(error as unknown as ApiError)?.errorMessage ?? 'SKU bundle not found.'}
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
        <Link to={`/products/${sku.productId}`} className="text-sm text-blue-600 hover:underline">
          ← {sku.productName ?? 'Product'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Bundle: {sku.id}</h1>
        <p className="text-sm text-muted-foreground">SKU Bundle</p>
      </div>

      {/* Stock count cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            { label: 'On Hand', value: sku.stockCount.onHand },
            { label: 'Available', value: sku.stockCount.available },
            { label: 'Ordered', value: sku.stockCount.ordered },
            { label: 'Backordered', value: sku.stockCount.backordered },
            { label: 'On PO', value: sku.stockCount.onPO },
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
        {(
          [
            { key: 'main', label: 'Main' },
            { key: 'components', label: 'Components' },
            { key: 'dimensions', label: 'Weight & Dimensions' },
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
        <BundleMainTab sku={sku} onSave={(data) => saveSkuMutation.mutate(data)} isSaving={saveSkuMutation.isPending} />
      )}

      {tab === 'components' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Bundle Components ({(sku.components ?? []).length})</h2>
            <button
              onClick={() => setShowAddComponent(true)}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
            >
              Add Component
            </button>
          </div>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Component SKU</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(sku.components ?? []).map((c) => (
                  <tr key={c.componentSkuId} className="hover:bg-muted/50">
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/skus/${c.componentSkuId}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {c.componentSkuId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{c.productName ?? '—'}</td>
                    <td className="px-3 py-2">{c.color ?? '—'}</td>
                    <td className="px-3 py-2">{c.size ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{c.quantity}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeComponentMutation.mutate(c.componentSkuId)}
                        disabled={removeComponentMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {(sku.components ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No components. Add SKUs to build this bundle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dimensions' && (
        <BundleDimensionsTab
          dimensions={sku.dimensions}
          onSave={(data) => saveDimensionsMutation.mutate(data)}
          isSaving={saveDimensionsMutation.isPending}
        />
      )}

      {/* Add Component modal */}
      {showAddComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Add Component SKU</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Search SKU</label>
                <input
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  placeholder="Type to search..."
                  value={componentSearch}
                  onChange={(e) => { setComponentSearch(e.target.value); setSelectedComponentId('') }}
                />
              </div>
              {(componentResults ?? []).length > 0 && (
                <ul className="max-h-48 overflow-y-auto rounded border text-sm">
                  {(componentResults ?? []).map((s) => (
                    <li
                      key={s.id}
                      onClick={() => { setSelectedComponentId(s.id); setComponentSearch(s.id) }}
                      className={`cursor-pointer px-3 py-2 hover:bg-muted ${selectedComponentId === s.id ? 'bg-muted font-medium' : ''}`}
                    >
                      {s.id} — {s.productName ?? ''} {s.colorSwatch?.name ?? ''} {s.sizing?.name ?? ''}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={componentQty}
                  onChange={(e) => setComponentQty(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddComponent(false); setComponentSearch(''); setSelectedComponentId('') }}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => addComponentMutation.mutate()}
                disabled={!selectedComponentId || componentQty < 1 || addComponentMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {addComponentMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface BundleMainTabProps {
  sku: SKU
  onSave: (data: Partial<SKU>) => void
  isSaving: boolean
}

function BundleMainTab({ sku, onSave, isSaving }: BundleMainTabProps) {
  const [form, setForm] = useState<Partial<SKU>>({
    availabilityDate: sku.availabilityDate ?? '',
    upc: sku.upc ?? '',
  })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">Bundle ID</label>
          <p className="font-mono">{sku.id}</p>
        </div>
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">Product ID</label>
          <p>{sku.productId}</p>
        </div>
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">Created</label>
          <p>{sku.creationDate?.slice(0, 10) ?? '—'}</p>
        </div>
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">Modified</label>
          <p>{sku.lastModifiedDate?.slice(0, 10) ?? '—'}</p>
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
          <label className="mb-1 block text-sm font-medium">UPC</label>
          <input
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={form.upc ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, upc: e.target.value }))}
          />
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

interface BundleDimensionsTabProps {
  dimensions: SKUDimensions | undefined
  onSave: (data: SKUDimensions) => void
  isSaving: boolean
}

function BundleDimensionsTab({ dimensions, onSave, isSaving }: BundleDimensionsTabProps) {
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
            {['LB', 'KG', 'OZ', 'G'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Length</label>
          <input type="number" className="w-full rounded border px-3 py-1.5 text-sm" value={form.length ?? ''} onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Width</label>
          <input type="number" className="w-full rounded border px-3 py-1.5 text-sm" value={form.width ?? ''} onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Height</label>
          <input type="number" className="w-full rounded border px-3 py-1.5 text-sm" value={form.height ?? ''} onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Dimension Unit</label>
        <select className="w-full rounded border px-2 py-1.5 text-sm" value={form.dimensionUnit ?? 'IN'} onChange={(e) => setForm((f) => ({ ...f, dimensionUnit: e.target.value }))}>
          {['IN', 'CM', 'MM', 'FT'].map((u) => <option key={u} value={u}>{u}</option>)}
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
