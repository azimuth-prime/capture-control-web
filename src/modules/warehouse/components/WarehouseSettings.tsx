import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { shippingService } from '../services/shippingService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { Warehouse, WarehouseType, WarehouseAddress, Carrier } from '../types'
import type { ApiError } from '../../../shared/types'

let toastId = 0

export function WarehouseSettings() {
  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const [warehouseModal, setWarehouseModal] = useState<Partial<Warehouse> | null>(null)
  const [carrierModal, setCarrierModal] = useState<Partial<Carrier> | null>(null)
  const qc = useQueryClient()

  function showToast(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const warehouseQ = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => warehouseService.findAllWarehouses().then((r) => r.data),
  })

  const carrierQ = useQuery({
    queryKey: ['carriers'],
    queryFn: () => shippingService.findAllCarriers().then((r) => r.data),
  })

  const saveWarehouseMut = useMutation({
    mutationFn: (d: Partial<Warehouse>) => warehouseService.saveWarehouse(d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses-all'] })
      setWarehouseModal(null)
      showToast('Warehouse saved.', true)
    },
    onError: (e: { response?: { data?: ApiError } }) =>
      showToast(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveCarrierMut = useMutation({
    mutationFn: (d: Partial<Carrier>) => shippingService.saveCarrier(d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carriers'] })
      setCarrierModal(null)
      showToast('Carrier saved.', true)
    },
    onError: (e: { response?: { data?: ApiError } }) =>
      showToast(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const inputCls = 'w-full rounded border px-3 py-1.5 text-sm'

  function setWAddr(f: Partial<WarehouseAddress>) {
    setWarehouseModal((p) => p ? { ...p, address: { ...p.address, ...f } } : null)
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <span>Warehouse Settings</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Warehouse Settings</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl space-y-6">

        {/* Warehouses */}
        <section className="rounded border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Warehouses</h2>
            <button onClick={() => setWarehouseModal({ type: 'PHYSICAL', state: 'ACTIVE' })}
              className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
              Add Warehouse
            </button>
          </div>
          {warehouseQ.isLoading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {warehouseQ.data?.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{w.name}</td>
                    <td className="px-3 py-2">{w.type}</td>
                    <td className="px-3 py-2">{w.state ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{w.description ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setWarehouseModal(w)}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {!warehouseQ.data?.length && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No warehouses.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Carriers */}
        <section className="rounded border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Shipping Carriers</h2>
            <button onClick={() => setCarrierModal({})}
              className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
              Add Carrier
            </button>
          </div>
          {carrierQ.isLoading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Account #</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {carrierQ.data?.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.accountNumber ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setCarrierModal(c)}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {!carrierQ.data?.length && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No carriers.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Warehouse Modal */}
      {warehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{warehouseModal.id ? 'Edit' : 'New'} Warehouse</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block">Name <span className="text-destructive">*</span></label>
                <input className={inputCls} value={warehouseModal.name ?? ''}
                  onChange={(e) => setWarehouseModal((p) => ({ ...p!, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block">Type</label>
                  <select className={inputCls} value={warehouseModal.type ?? 'PHYSICAL'}
                    onChange={(e) => setWarehouseModal((p) => ({ ...p!, type: e.target.value as WarehouseType }))}>
                    <option value="PHYSICAL">Physical</option>
                    <option value="LOGICAL">Logical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block">State</label>
                  <select className={inputCls} value={warehouseModal.state ?? 'ACTIVE'}
                    onChange={(e) => setWarehouseModal((p) => ({ ...p!, state: e.target.value as 'ACTIVE' | 'INACTIVE' }))}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block">Description</label>
                <input className={inputCls} value={warehouseModal.description ?? ''}
                  onChange={(e) => setWarehouseModal((p) => ({ ...p!, description: e.target.value }))} />
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Address</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['address1', 'Address 1'],
                    ['address2', 'Address 2'],
                    ['city', 'City'],
                    ['province', 'Province/State'],
                    ['postalCode', 'Postal Code'],
                    ['country', 'Country'],
                    ['phone', 'Phone'],
                  ] as [keyof WarehouseAddress, string][]).map(([field, label]) => (
                    <div key={field} className={field === 'address1' || field === 'address2' ? 'col-span-2' : ''}>
                      <label className="mb-1 block text-xs">{label}</label>
                      <input className={inputCls} value={(warehouseModal.address?.[field] as string) ?? ''}
                        onChange={(e) => setWAddr({ [field]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setWarehouseModal(null)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => saveWarehouseMut.mutate(warehouseModal)}
                disabled={saveWarehouseMut.isPending || !warehouseModal.name}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveWarehouseMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrier Modal */}
      {carrierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{carrierModal.id ? 'Edit' : 'New'} Carrier</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block">Name <span className="text-destructive">*</span></label>
                <input className={inputCls} value={carrierModal.name ?? ''}
                  onChange={(e) => setCarrierModal((p) => ({ ...p!, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block">Account Number</label>
                <input className={inputCls} value={carrierModal.accountNumber ?? ''}
                  onChange={(e) => setCarrierModal((p) => ({ ...p!, accountNumber: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCarrierModal(null)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button onClick={() => saveCarrierMut.mutate(carrierModal)}
                disabled={saveCarrierMut.isPending || !carrierModal.name}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveCarrierMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
