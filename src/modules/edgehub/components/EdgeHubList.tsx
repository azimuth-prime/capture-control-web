import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { edgehubService } from '../services/edgehubService'
import axiosInstance from '../../../auth/axiosInstance'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { ApiError } from '../../../shared/types'

interface PhysicalWarehouse {
  id: string
  name: string
}

function fetchPhysicalWarehouses(): Promise<PhysicalWarehouse[]> {
  return axiosInstance
    .get<PhysicalWarehouse[]>('/capture/warehouse/physical')
    .then((r) => r.data)
}

export function EdgeHubList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWarehouseId, setNewWarehouseId] = useState('')
  const [formError, setFormError] = useState('')

  const {
    data: hubs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['edgehubs'],
    queryFn: () => edgehubService.findAll().then((r) => r.data),
  })

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses', 'physical'],
    queryFn: fetchPhysicalWarehouses,
    enabled: modalOpen,
  })

  const createMutation = useMutation<
    { id: string },
    { response?: { data?: ApiError } },
    { name: string; warehouseId: string }
  >({
    mutationFn: ({ name, warehouseId }) =>
      edgehubService
        .save({ name, physicalWarehouse: { id: warehouseId } })
        .then((r) => r.data),
    onSuccess: (hub) => {
      queryClient.invalidateQueries({ queryKey: ['edgehubs'] })
      closeModal()
      navigate(`/edgehubs/${hub.id}`)
    },
    onError: (err) => {
      setFormError(
        err.response?.data?.errorMessage ?? 'Failed to create EdgeHub.'
      )
    },
  })

  function openModal() {
    setNewName('')
    setNewWarehouseId('')
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setNewName('')
    setNewWarehouseId('')
    setFormError('')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!newName.trim()) {
      setFormError('Name is required.')
      return
    }
    if (!newWarehouseId) {
      setFormError('Warehouse is required.')
      return
    }
    createMutation.mutate({ name: newName.trim(), warehouseId: newWarehouseId })
  }

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:underline">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-foreground">Edge Hubs</li>
        </ol>
      </nav>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Edge Hubs</h1>
        <button
          onClick={openModal}
          className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New Hub
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading edge hubs..." />}
      {isError && (
        <ErrorMessage
          message={(error as Error).message}
          onRetry={refetch}
        />
      )}

      {hubs && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Serial Number</th>
                <th className="px-4 py-2">Warehouse</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {hubs.map((hub) => (
                <tr
                  key={hub.id}
                  onClick={() => navigate(`/edgehubs/${hub.id}`)}
                  className="cursor-pointer border-b hover:bg-muted/40"
                >
                  <td className="px-4 py-2 font-medium">{hub.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {hub.serialNumber ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    {hub.physicalWarehouse?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    {hub.status ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          hub.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {hub.status}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {hubs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No edge hubs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── NEW HUB MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Edge Hub</h2>
              <button
                onClick={closeModal}
                className="text-destructive hover:opacity-70"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-3 rounded border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} noValidate>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Hub name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Warehouse <span className="text-destructive">*</span>
                  </label>
                  {warehousesLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading warehouses...
                    </p>
                  ) : (
                    <select
                      value={newWarehouseId}
                      onChange={(e) => setNewWarehouseId(e.target.value)}
                      className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select warehouse...</option>
                      {(warehouses ?? []).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
