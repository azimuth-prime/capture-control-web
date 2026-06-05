import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { ApiError } from '../../../shared/types'
import { useState } from 'react'

let toastId = 0

export function PurchaseSettings() {
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
        <span>Purchase Settings</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Purchase Settings</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {configQ.isLoading && <LoadingSpinner />}

      {gc && (
        <div className="max-w-2xl space-y-6">

          {/* Automation */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Automation</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Auto-Generate Purchase Orders</p>
                <p className="mb-2 text-xs text-muted-foreground">Automatically generate POs when stock falls below reorder threshold.</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.autoGenPOs} onChange={() => param('autoGenPOs', true)} /> Enabled</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.autoGenPOs} onChange={() => param('autoGenPOs', false)} /> Disabled</label>
                </div>
              </div>
              {gc.autoGenPOs && (
                <div>
                  <p className="mb-1 font-medium">Vendor Selection</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2"><input type="radio" checked={gc.vendorSelection === 'FASTEST'} onChange={() => param('vendorSelection', 'FASTEST')} /> Fastest</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={gc.vendorSelection === 'CHEAPEST'} onChange={() => param('vendorSelection', 'CHEAPEST')} /> Cheapest</label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Communications */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Communications</h2>
            <div className="text-sm">
              <p className="mb-1 font-medium">Auto-Send PO to Supplier on Issue</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" checked={!!gc.autoSendPO} onChange={() => param('autoSendPO', true)} /> Enabled</label>
                <label className="flex items-center gap-2"><input type="radio" checked={!gc.autoSendPO} onChange={() => param('autoSendPO', false)} /> Disabled</label>
              </div>
            </div>
          </section>

          {/* Invoicing */}
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Invoicing</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Require Supplier Invoice Before Receipt</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2"><input type="radio" checked={!!gc.poRequireInvoice} onChange={() => param('poRequireInvoice', true)} /> Required</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={!gc.poRequireInvoice} onChange={() => param('poRequireInvoice', false)} /> Not required</label>
                </div>
              </div>
              <div>
                <p className="mb-1 font-medium">Landed Cost Execution</p>
                <div className="flex gap-4">
                  {['NONE', 'ONINVOICE', 'ONSALE'].map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input type="radio" checked={gc.landedCostExecution === v} onChange={() => param('landedCostExecution', v)} />
                      {v === 'NONE' ? 'None' : v === 'ONINVOICE' ? 'On Invoice' : 'On Sale'}
                    </label>
                  ))}
                </div>
              </div>
              {gc.landedCostExecution !== 'NONE' && (
                <div>
                  <p className="mb-1 font-medium">Landed Cost Calculation Method</p>
                  <div className="flex gap-4">
                    {['WEIGHT', 'QUANTITY', 'VALUE'].map((v) => (
                      <label key={v} className="flex items-center gap-2">
                        <input type="radio" checked={gc.landedCostCalculation === v} onChange={() => param('landedCostCalculation', v)} />
                        {v.charAt(0) + v.slice(1).toLowerCase()}
                      </label>
                    ))}
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
