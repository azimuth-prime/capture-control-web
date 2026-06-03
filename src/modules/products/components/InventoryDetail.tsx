import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skuService } from '../services/skuService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { Inventory } from '../types'
import type { ApiError } from '../../../shared/types'

let toastCounter = 0

export function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'main' | 'media' | 'transactions' | 'rfid'>('main')
  const [toast, setToast] = useState<{ id: number; message: string; success: boolean } | null>(null)

  function showToast(message: string, success: boolean) {
    const tid = ++toastCounter
    setToast({ id: tid, message, success })
    setTimeout(() => setToast((t) => (t?.id === tid ? null : t)), 4000)
  }

  const { data: inv, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => skuService.findInventoryById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: transactions } = useQuery({
    queryKey: ['inventory-transactions', id],
    queryFn: () => skuService.findTransactionsByInventoryId(id!).then((r) => r.data),
    enabled: !!id && tab === 'transactions',
  })

  const { data: skuConfig } = useQuery({
    queryKey: ['sku-config'],
    queryFn: () => skuService.findSkuConfig().then((r) => r.data),
  })

  const saveInvMutation = useMutation({
    mutationFn: (data: Partial<Inventory>) =>
      skuService.updateInventory({ ...data, id: id! }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', id] })
      showToast('Inventory item updated.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to update.', false),
  })

  const uploadMediaMutation = useMutation({
    mutationFn: (file: File) => skuService.uploadInventoryMedia(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', id] })
      showToast('Media uploaded.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Upload failed.', false),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => skuService.deleteInventoryMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', id] })
      showToast('Media removed.', true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Delete failed.', false),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !inv)
    return (
      <ErrorMessage
        message={(error as unknown as ApiError)?.errorMessage ?? 'Inventory item not found.'}
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
        <Link
          to={`/products/skus/${inv.skuId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← {inv.productName ?? 'SKU'}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {inv.lotSerial ?? inv.id}
        </h1>
        <p className="font-mono text-xs text-muted-foreground">{inv.id}</p>
      </div>

      <div className="mb-4 border-b">
        {(
          [
            { key: 'main', label: 'Main' },
            { key: 'media', label: 'Media' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'rfid', label: 'RFID' },
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
        <MainTab
          inv={inv}
          warehouseOptions={skuConfig?.warehouses ?? []}
          onSave={(data) => saveInvMutation.mutate(data)}
          isSaving={saveInvMutation.isPending}
        />
      )}

      {tab === 'media' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Media</h2>
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
            {(inv.media ?? []).map((m) => (
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
            {(inv.media ?? []).length === 0 && (
              <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">
                No media uploaded.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div>
          <h2 className="mb-3 font-medium">Transaction History</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(transactions ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">{t.date?.slice(0, 10)}</td>
                    <td className="px-3 py-2">{t.type}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.quantity}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.reference ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.description ?? '—'}</td>
                  </tr>
                ))}
                {(transactions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rfid' && (
        <div className="rounded border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          RFID tag management requires an Edge Hub to be configured for this warehouse.
          <br />
          <Link to="/edgehubs" className="mt-2 block text-blue-600 hover:underline">
            Manage Edge Hubs →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Main tab sub-component ────────────────────────────────────────────────────

interface MainTabProps {
  inv: Inventory
  warehouseOptions: { id: string; name: string }[]
  onSave: (data: Partial<Inventory>) => void
  isSaving: boolean
}

function MainTab({ inv, warehouseOptions, onSave, isSaving }: MainTabProps) {
  const [form, setForm] = useState<Partial<Inventory>>({
    lotSerial: inv.lotSerial ?? '',
    state: inv.state,
    warehouse: inv.warehouse,
    receivedDate: inv.receivedDate ?? '',
    expiryDate: inv.expiryDate ?? '',
  })

  return (
    <div className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">SKU ID</label>
          <p>{inv.skuId}</p>
        </div>
        <div>
          <label className="mb-1 block font-medium text-muted-foreground">Product</label>
          <p>{inv.productName ?? '—'}</p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Lot / Serial</label>
        <input
          className="w-full rounded border px-3 py-1.5 text-sm"
          value={form.lotSerial ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, lotSerial: e.target.value }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">State</label>
        <select
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={form.state ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
        >
          {['ACTIVE', 'RESERVED', 'QUARANTINE', 'CONSUMED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Warehouse</label>
        <select
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={form.warehouse?.id ?? ''}
          onChange={(e) => {
            const wh = warehouseOptions.find((w) => w.id === e.target.value)
            if (wh) setForm((f) => ({ ...f, warehouse: wh }))
          }}
        >
          {warehouseOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Received Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={typeof form.receivedDate === 'string' ? form.receivedDate.slice(0, 10) : ''}
            onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expiry Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={typeof form.expiryDate === 'string' ? form.expiryDate.slice(0, 10) : ''}
            onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
          />
        </div>
      </div>
      {inv.stockCount && (
        <div className="grid grid-cols-3 gap-3 rounded border bg-muted/30 p-3 text-sm">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">On Hand</p>
            <p className="font-bold">{inv.stockCount.onHand}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="font-bold">{inv.stockCount.reserved}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-bold">{inv.stockCount.available}</p>
          </div>
        </div>
      )}
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
