import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from '../services/warehouseService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { ApiError } from '../../../shared/types'
import type { TransferSummary } from '../types'

let toastCounter = 0

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; success: boolean }[]>([])
  function addToast(message: string, success: boolean) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, success }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }
  return { toasts, addToast }
}

export function TransferList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toasts, addToast } = useToast()

  const [newModalOpen, setNewModalOpen] = useState(false)
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')

  const { data: transfers, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['open-transfers'],
    queryFn: () => warehouseService.findAllOpenTransfers().then((r) => r.data),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['physical-warehouses'],
    queryFn: () => warehouseService.findAllPhysicalWarehouses().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseService
        .saveTransfer({ fromWarehouse: fromWarehouseId, toWarehouse: toWarehouseId })
        .then((r) => r.data),
    onSuccess: (transfer) => {
      setNewModalOpen(false)
      setFromWarehouseId('')
      setToWarehouseId('')
      queryClient.invalidateQueries({ queryKey: ['open-transfers'] })
      navigate(`/transfer/${transfer.id}`)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Create transfer failed.', false),
  })

  const deleteMutation = useMutation({
    mutationFn: (transferId: string) =>
      warehouseService.deleteTransferById(transferId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-transfers'] })
      addToast('Transfer deleted.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      addToast(err.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  function handleDelete(e: React.MouseEvent, transfer: TransferSummary) {
    e.stopPropagation()
    if (!confirm(`Delete transfer ${transfer.id}?`)) return
    deleteMutation.mutate(transfer.id)
  }

  function openNewModal() {
    setFromWarehouseId('')
    setToWarehouseId('')
    setNewModalOpen(true)
  }

  return (
    <div className='container-fluid px-4 py-2'>
      <nav className='mb-4 text-sm text-muted-foreground'>
        <ol className='flex gap-2'>
          <li><Link to='/' className='hover:underline'>Dashboard</Link></li>
          <li>/</li>
          <li className='font-medium text-foreground'>Transfers</li>
        </ol>
      </nav>

      {toasts.map((t) => (
        <div
          key={t.id}
          className={`mb-3 rounded-md p-3 text-sm ${
            t.success
              ? 'border border-green-300 bg-green-50 text-green-800'
              : 'border border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {t.message}
        </div>
      ))}

      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Open Transfers</h1>
        <button
          onClick={openNewModal}
          className='rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50'
        >
          + New Transfer
        </button>
      </div>

      {isLoading && <LoadingSpinner message='Loading transfers...' />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {transfers && (
        <div className='overflow-x-auto rounded-lg border bg-card'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b bg-muted/40 text-left text-muted-foreground'>
                <th className='px-4 py-2'>Transfer #</th>
                <th className='px-4 py-2'>From</th>
                <th className='px-4 py-2'>To</th>
                <th className='px-4 py-2'>State</th>
                <th className='px-4 py-2 text-right'>Items</th>
                <th className='px-4 py-2'></th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  onClick={() => navigate(`/transfer/${transfer.id}`)}
                  className='cursor-pointer border-b hover:bg-muted/40'
                >
                  <td className='px-4 py-2 font-mono text-xs'>{transfer.id}</td>
                  <td className='px-4 py-2'>{transfer.fromWarehouse?.name ?? '—'}</td>
                  <td className='px-4 py-2'>{transfer.toWarehouse?.name ?? '—'}</td>
                  <td className='px-4 py-2'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        transfer.state === 'COMPLETE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {transfer.state}
                    </span>
                  </td>
                  <td className='px-4 py-2 text-right'>{transfer.itemCount}</td>
                  <td className='px-4 py-2'>
                    <button
                      onClick={(e) => handleDelete(e, transfer)}
                      disabled={deleteMutation.isPending}
                      className='rounded border border-destructive px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-8 text-center text-muted-foreground'>
                    No open transfers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Transfer modal */}
      {newModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-sm rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>New Transfer</h2>
              <button onClick={() => setNewModalOpen(false)} className='text-destructive hover:opacity-70'>✕</button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  From Warehouse <span className='text-destructive'>*</span>
                </label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                >
                  <option value=''>-- Select warehouse --</option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  To Warehouse <span className='text-destructive'>*</span>
                </label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className='w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
                >
                  <option value=''>-- Select warehouse --</option>
                  {warehouses
                    ?.filter((w) => w.id !== fromWarehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className='mt-5 flex justify-end gap-2'>
              <button
                onClick={() => setNewModalOpen(false)}
                className='rounded border px-4 py-1.5 text-sm hover:bg-muted'
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !fromWarehouseId || !toWarehouseId}
                className='rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40'
              >
                {createMutation.isPending ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
