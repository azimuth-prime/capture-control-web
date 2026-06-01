import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { ApiError } from '../../../shared/types'

export function PurchaseReorder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: po, isLoading, isError, error } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const reorderMutation = useMutation({
    mutationFn: () =>
      purchaseService.reorderPO({
        purchaseOrderId: id!,
        supplierId: po?.supplier?.id,
        warehouseId: po?.warehouse?.id,
      }).then((r) => r.data),
    onSuccess: (data) => {
      navigate(`/purchase/${data.id}`)
    },
  })

  if (isLoading) return <LoadingSpinner message="Loading purchase order..." />
  if (isError) return <ErrorMessage message={(error as Error).message} />
  if (!po) return null

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/purchase" className="hover:underline">Purchase Orders</Link></li>
          <li>/</li>
          <li><Link to={`/purchase/${id}`} className="hover:underline">{id}</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Re-Order</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-semibold">Re-Order</h1>

        {reorderMutation.isError && (
          <div className="mb-4">
            <ErrorMessage
              message={
                (reorderMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                'Re-order failed.'
              }
            />
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            This will create a new purchase order using the same supplier and warehouse as the original.
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Original PO</dt>
              <dd className="font-mono">{id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Supplier</dt>
              <dd>{po.supplier?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd>{po.warehouse?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items to re-order</dt>
              <dd>{po.items.length}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => navigate(`/purchase/${id}`)}
            className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => reorderMutation.mutate()}
            disabled={reorderMutation.isPending}
            className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            {reorderMutation.isPending ? 'Creating...' : 'Create Re-Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
