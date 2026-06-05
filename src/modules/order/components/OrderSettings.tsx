import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { ApiError } from '../../../shared/types'

let toastId = 0

export function OrderSettings() {
  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const qc = useQueryClient()

  function toast_(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const configQ = useQuery({
    queryKey: ['global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  const paramMut = useMutation({
    mutationFn: (req: { name: string; value: string }) => configService.setParameter(req).then((r) => r.data),
    onSuccess: (data) => { qc.setQueryData(['global-config'], data); toast_('Saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  function param(name: string, value: string | boolean) {
    paramMut.mutate({ name, value: String(value) })
  }

  const gc = configQ.data

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <span>Order Settings</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Sales Order Settings</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {configQ.isLoading && <LoadingSpinner />}

      {gc && (
        <div className="max-w-2xl space-y-6">

          {/* Stock */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Stock Behaviour</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Backorders</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.backorder} onChange={() => param('backorder', true)} /> Allow backorders</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.backorder} onChange={() => param('backorder', false)} /> Disable backorders</label>
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Split Shipments</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.splitShip} onChange={() => param('splitShip', true)} /> Allow partial shipments</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.splitShip} onChange={() => param('splitShip', false)} /> Require full shipment</label>
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Backorder Fulfillment</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.fulfillOnReceipt} onChange={() => param('fulfillOnReceipt', true)} /> Auto-fulfill on receipt</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.fulfillOnReceipt} onChange={() => param('fulfillOnReceipt', false)} /> Manual</label>
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Inventory Allocation Method</p>
                <div className="flex gap-4 flex-wrap">
                  {[{ v: 'FIFO', l: 'FIFO' }, { v: 'EDFIFO', l: 'Expiry Date FIFO' }, { v: 'LCFIFO', l: 'Lowest Location FIFO' }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2">
                      <input type="radio" checked={gc.allocationMethod === v} onChange={() => param('allocationMethod', v)} />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Warehouse Fulfillment */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Warehouse Fulfillment</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Multi-Warehouse Fulfillment</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.multiWarehouse} onChange={() => param('multiWarehouse', true)} /> Enabled</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.multiWarehouse} onChange={() => param('multiWarehouse', false)} /> Disabled</label>
                </div>
              </div>
              {gc.multiWarehouse && (
                <>
                  <div>
                    <p className="mb-1 font-medium">Geographic Matching</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2"><input type="radio" checked={!!gc.geoWarehouse} onChange={() => param('geoWarehouse', true)} /> Use nearest warehouse</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={!gc.geoWarehouse} onChange={() => param('geoWarehouse', false)} /> Any warehouse</label>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Country Restriction</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2"><input type="radio" checked={!!gc.countryLimitedWarehouse} onChange={() => param('countryLimitedWarehouse', true)} /> Same country only</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={!gc.countryLimitedWarehouse} onChange={() => param('countryLimitedWarehouse', false)} /> Any country</label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Invoicing */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Invoicing</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Invoice Creation</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={gc.invoiceCreation === 'ALL'} onChange={() => param('invoiceCreation', 'ALL')} /> All orders</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={gc.invoiceCreation === 'MANUAL'} onChange={() => param('invoiceCreation', 'MANUAL')} /> Manual</label>
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Auto-Send Invoice on Shipment</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.invoiceAutoSend} onChange={() => param('invoiceAutoSend', true)} /> Enabled</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.invoiceAutoSend} onChange={() => param('invoiceAutoSend', false)} /> Disabled</label>
                </div>
              </div>
            </div>
          </section>

          {/* Drop Ship */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Drop Ship</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Enable Drop Ship</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.enableDropship} onChange={() => param('enableDropship', true)} /> Enabled</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.enableDropship} onChange={() => param('enableDropship', false)} /> Disabled</label>
                </div>
              </div>
              {gc.enableDropship && (
                <div>
                  <p className="mb-1 font-medium">Direct Ship to Customer</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" checked={!!gc.dropshipDirectShip} onChange={() => param('dropshipDirectShip', true)} /> Ship direct to customer</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={!gc.dropshipDirectShip} onChange={() => param('dropshipDirectShip', false)} /> Ship to warehouse first</label>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
