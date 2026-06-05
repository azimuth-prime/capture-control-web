import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skuService } from '../services/skuService'
import { productService } from '../services/productService'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { ColorSwatch, Sizing, StockUnit } from '../types'
import type { ApiError } from '../../../shared/types'

type Tab = 'products' | 'skus'

let toastId = 0

export function ProductSettings() {
  const [tab, setTab] = useState<Tab>('products')
  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const [swatchModal, setSwatchModal] = useState<Partial<ColorSwatch> | null>(null)
  const [sizingModal, setSizingModal] = useState<Partial<Sizing> | null>(null)
  const [stockUnitModal, setStockUnitModal] = useState<Partial<StockUnit> | null>(null)
  const qc = useQueryClient()

  function toast_(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const configQ = useQuery({
    queryKey: ['global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  const skuConfigQ = useQuery({
    queryKey: ['sku-config'],
    queryFn: () => skuService.findSkuConfig().then((r) => r.data),
  })

  const paramMut = useMutation({
    mutationFn: (req: { name: string; value: string }) => configService.setParameter(req).then((r) => r.data),
    onSuccess: (data) => { qc.setQueryData(['global-config'], data); toast_('Saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveSwatchMut = useMutation({
    mutationFn: (d: Partial<ColorSwatch>) => skuService.saveColorSwatch(d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); setSwatchModal(null); toast_('Color swatch saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteSwatchMut = useMutation({
    mutationFn: (id: string) => skuService.deleteColorSwatch(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); toast_('Deleted.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const saveSizingMut = useMutation({
    mutationFn: (d: Partial<Sizing>) => skuService.saveSizing(d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); setSizingModal(null); toast_('Sizing saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteSizingMut = useMutation({
    mutationFn: (id: string) => skuService.deleteSizing(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); toast_('Deleted.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const saveStockUnitMut = useMutation({
    mutationFn: (d: Partial<StockUnit>) => productService.saveStockUnit(d).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); setStockUnitModal(null); toast_('Stock unit saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteStockUnitMut = useMutation({
    mutationFn: (id: string) => productService.deleteStockUnit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sku-config'] }); toast_('Deleted.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const inputCls = 'w-full rounded border px-3 py-1.5 text-sm'

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <span>Product Settings</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Product Settings</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b">
        {(['products', 'skus'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t border border-b-0 px-4 py-1.5 text-sm capitalize ${tab === t ? 'border-border bg-background font-medium' : 'hover:bg-muted'}`}>
            {t === 'products' ? 'Products' : 'SKUs'}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'products' && (
        <div className="space-y-6">
          {/* Single Variation toggle */}
          <div className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">SKU Variation</h2>
            {configQ.isLoading ? <LoadingSpinner /> : configQ.data && (
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!!configQ.data.singleVariation}
                    onChange={() => paramMut.mutate({ name: 'singleVariation', value: 'true' })} />
                  Single SKU per Product
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!configQ.data.singleVariation}
                    onChange={() => paramMut.mutate({ name: 'singleVariation', value: 'false' })} />
                  Multiple SKUs per Product
                </label>
              </div>
            )}
          </div>

          {/* Stock Units */}
          <div className="rounded border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Stock Units</h2>
              <button onClick={() => setStockUnitModal({})}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                Add Stock Unit
              </button>
            </div>
            {skuConfigQ.isLoading ? <LoadingSpinner /> : (
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {skuConfigQ.data?.stockUnits.map((su) => (
                    <tr key={su.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{su.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{su.description ?? '—'}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setStockUnitModal(su)} className="mr-2 text-xs text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => deleteStockUnitMut.mutate(su.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!skuConfigQ.data?.stockUnits.length && (
                    <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No stock units.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SKUs tab */}
      {tab === 'skus' && (
        <div className="space-y-6">
          {/* Color Swatches */}
          <div className="rounded border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Color Swatches</h2>
              <button onClick={() => setSwatchModal({})}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                Add Swatch
              </button>
            </div>
            {skuConfigQ.isLoading ? <LoadingSpinner /> : (
              <div className="flex flex-wrap gap-3">
                {skuConfigQ.data?.colorSwatches.map((cs) => (
                  <div key={cs.id} className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                    <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: cs.hexCode }} />
                    <span>{cs.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{cs.hexCode}</span>
                    <button onClick={() => setSwatchModal(cs)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteSwatchMut.mutate(cs.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                ))}
                {!skuConfigQ.data?.colorSwatches.length && (
                  <p className="text-sm text-muted-foreground">No color swatches.</p>
                )}
              </div>
            )}
          </div>

          {/* Sizings */}
          <div className="rounded border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Sizings</h2>
              <button onClick={() => setSizingModal({})}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                Add Sizing
              </button>
            </div>
            {skuConfigQ.isLoading ? <LoadingSpinner /> : (
              <div className="flex flex-wrap gap-2">
                {skuConfigQ.data?.sizings.map((sz) => (
                  <div key={sz.id} className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                    <span>{sz.name}</span>
                    <button onClick={() => setSizingModal(sz)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteSizingMut.mutate(sz.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                ))}
                {!skuConfigQ.data?.sizings.length && (
                  <p className="text-sm text-muted-foreground">No sizings.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color Swatch Modal */}
      {swatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{swatchModal.id ? 'Edit' : 'New'} Color Swatch</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Name</label>
              <input className={inputCls} value={swatchModal.name ?? ''}
                onChange={(e) => setSwatchModal((p) => ({ ...p!, name: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm">Hex Code</label>
              <div className="flex gap-2">
                <input className={inputCls} value={swatchModal.hexCode ?? ''}
                  onChange={(e) => setSwatchModal((p) => ({ ...p!, hexCode: e.target.value }))} placeholder="#RRGGBB" />
                {swatchModal.hexCode && <span className="h-9 w-9 rounded border" style={{ backgroundColor: swatchModal.hexCode }} />}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSwatchModal(null)} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => saveSwatchMut.mutate(swatchModal)} disabled={saveSwatchMut.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveSwatchMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sizing Modal */}
      {sizingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{sizingModal.id ? 'Edit' : 'New'} Sizing</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm">Name</label>
              <input className={inputCls} value={sizingModal.name ?? ''}
                onChange={(e) => setSizingModal((p) => ({ ...p!, name: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSizingModal(null)} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => saveSizingMut.mutate(sizingModal)} disabled={saveSizingMut.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveSizingMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Unit Modal */}
      {stockUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{stockUnitModal.id ? 'Edit' : 'New'} Stock Unit</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Name</label>
              <input className={inputCls} value={stockUnitModal.name ?? ''}
                onChange={(e) => setStockUnitModal((p) => ({ ...p!, name: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm">Description</label>
              <input className={inputCls} value={stockUnitModal.description ?? ''}
                onChange={(e) => setStockUnitModal((p) => ({ ...p!, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setStockUnitModal(null)} className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => saveStockUnitMut.mutate(stockUnitModal)} disabled={saveStockUnitMut.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveStockUnitMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
