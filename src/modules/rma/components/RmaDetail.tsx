import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rmaService } from '../services/rmaService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { RMAItem, RMAState } from '../types'
import type { ApiError } from '../../../shared/types'

const STATE_CLASSES: Record<RMAState, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function RmaDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  // Local edits: map from item id → partial edits
  const [edits, setEdits] = useState<Record<string, { quantityReturned?: number; reasonId?: string }>>({})

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: rma, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rma', id],
    queryFn: () => rmaService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: reasons } = useQuery({
    queryKey: ['rma-reasons'],
    queryFn: () => rmaService.findAllReasons().then((r) => r.data),
  })

  const saveItemsMutation = useMutation({
    mutationFn: () => {
      const items = (rma?.items ?? []).map((item) => ({
        id: item.id,
        inventoryId: item.inventory.id,
        orderItemId: item.orderItemId,
        lineNumber: item.lineNumber,
        quantityReturned: edits[item.id]?.quantityReturned ?? item.quantityReturned,
        reasonId: edits[item.id]?.reasonId ?? item.reasonId ?? '',
      }))
      return rmaService.saveItemsToRMA({ rmaId: id!, items })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rma', id] })
      setEdits({})
      showToast('Items saved successfully.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  function setItemField(itemId: string, field: 'quantityReturned' | 'reasonId', value: string | number) {
    setEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  function getItemValue<K extends keyof RMAItem>(item: RMAItem, field: K): RMAItem[K] {
    const edit = edits[item.id]
    if (edit && field in edit) return (edit as Record<string, unknown>)[field as string] as RMAItem[K]
    return item[field]
  }

  if (isLoading) return <LoadingSpinner message="Loading RMA..." />
  if (isError) return <ErrorMessage message={(error as Error).message} onRetry={refetch} />
  if (!rma) return null

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/rma" className="hover:underline">RMAs</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{id}</li>
        </ol>
      </nav>

      {toast && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            toast.success
              ? 'border border-green-300 bg-green-50 text-green-800'
              : 'border border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">RMA #{id}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              Order:{' '}
              <Link to={`/order/${rma.order?.id}`} className="font-medium text-foreground hover:underline">
                {rma.order?.id ?? '—'}
              </Link>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATE_CLASSES[rma.state] ?? 'bg-muted text-muted-foreground'
              }`}
            >
              {rma.state}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => showToast('Print functionality coming soon.', true)}
            className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Print
          </button>
        </div>
      </div>

      {/* Date info */}
      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium">{rma.creationDate?.substring(0, 10) ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Issue Date</p>
          <p className="font-medium">{rma.issueDate?.substring(0, 10) ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expected Return</p>
          <p className="font-medium">{rma.expectedReturnDate?.substring(0, 10) ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last Modified</p>
          <p className="font-medium">{rma.lastModifiedDate?.substring(0, 10) ?? '—'}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="mb-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Lot / Serial</th>
              <th className="px-4 py-2 text-right">Max Qty</th>
              <th className="px-4 py-2 text-right">Qty Returned</th>
              <th className="px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rma.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2 text-muted-foreground">{item.lineNumber}</td>
                <td className="px-4 py-2">
                  <div className="font-medium">{item.inventory.productName}</div>
                  {item.inventory.productDescription && (
                    <div className="text-xs text-muted-foreground">{item.inventory.productDescription}</div>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{item.inventory.lotSerial}</td>
                <td className="px-4 py-2 text-right">{item.maxQuantity}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={item.maxQuantity}
                    value={getItemValue(item, 'quantityReturned') ?? 0}
                    onChange={(e) =>
                      setItemField(item.id, 'quantityReturned', Math.min(item.maxQuantity, Number(e.target.value)))
                    }
                    className="w-20 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={getItemValue(item, 'reasonId') ?? ''}
                    onChange={(e) => setItemField(item.id, 'reasonId', e.target.value)}
                    className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Select reason —</option>
                    {(reasons ?? []).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {rma.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No items on this RMA.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rma.items.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => saveItemsMutation.mutate()}
            disabled={saveItemsMutation.isPending}
            className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            {saveItemsMutation.isPending ? 'Saving...' : 'Save Items'}
          </button>
        </div>
      )}
    </div>
  )
}
