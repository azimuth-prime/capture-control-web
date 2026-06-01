import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { purchaseService } from '../services/purchaseService'
import axiosInstance from '../../../auth/axiosInstance'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'

interface OrgSearchResult {
  id: string
  name: string
  organizationType?: string
}

interface WarehouseOption {
  id: string
  name: string
}

export function NewPurchaseOrder() {
  const navigate = useNavigate()

  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [requestedByDate, setRequestedByDate] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')

  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierKeyword, setSupplierKeyword] = useState('')
  const debouncedSupplierKw = useDebounce(supplierKeyword, 300)

  const [formError, setFormError] = useState('')

  // Warehouse list
  const warehouseQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => axiosInstance.get<WarehouseOption[]>('/capture/warehouse').then((r) => r.data),
  })

  // Supplier search
  const supplierSearchQuery = useQuery({
    queryKey: ['supplier-search', debouncedSupplierKw],
    queryFn: () =>
      axiosInstance
        .post<{ results: OrgSearchResult[] }>('/capture/organization/search', {
          keyword: debouncedSupplierKw.length > 0 ? debouncedSupplierKw.toUpperCase() : '*',
          page: 0,
          resultsPerPage: 10,
          filters: [{ organizationType: 'SUPPLIER' }],
        })
        .then((r) => r.data),
    enabled: supplierModalOpen,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      purchaseService.save({
        supplier: { id: supplierId, name: supplierName },
        warehouse: { id: warehouseId, name: '' },
        requestedByDate: requestedByDate || null,
        specialInstructions,
        items: [],
        invoices: [],
        state: 'DRAFT',
      }).then((r) => r.data),
    onSuccess: (data) => {
      navigate(`/purchase/${data.id}`)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      setFormError(err.response?.data?.errorMessage ?? 'Failed to create purchase order.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!supplierId) {
      setFormError('Please select a supplier.')
      return
    }
    if (!warehouseId) {
      setFormError('Please select a warehouse.')
      return
    }
    createMutation.mutate()
  }

  function inputCls() {
    return 'w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  }

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/purchase" className="hover:underline">Purchase Orders</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">New Purchase Order</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-semibold">New Purchase Order</h1>

        {formError && (
          <div className="mb-4">
            <ErrorMessage message={formError} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Supplier */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Supplier <span className="text-destructive">*</span>
              </label>
              {supplierId ? (
                <div className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2 text-sm">
                  <span>{supplierName}</span>
                  <button
                    type="button"
                    onClick={() => { setSupplierId(''); setSupplierName('') }}
                    className="text-xs text-destructive underline hover:no-underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(true)}
                  className="w-full rounded border px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  Click to select supplier...
                </button>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Warehouse <span className="text-destructive">*</span>
              </label>
              {warehouseQuery.isLoading && <LoadingSpinner message="Loading warehouses..." />}
              {warehouseQuery.data && (
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className={inputCls()}
                >
                  <option value="">— Select warehouse —</option>
                  {warehouseQuery.data.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Requested By Date */}
            <div>
              <label className="mb-1 block text-sm font-medium">Requested By Date</label>
              <input
                type="date"
                value={requestedByDate}
                onChange={(e) => setRequestedByDate(e.target.value)}
                className={inputCls()}
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="mb-1 block text-sm font-medium">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className={inputCls()}
                placeholder="Enter any special instructions..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/purchase')}
              className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>

      {/* ── SUPPLIER SEARCH MODAL ── */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Supplier</h2>
              <button onClick={() => setSupplierModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={supplierKeyword}
              onChange={(e) => setSupplierKeyword(e.target.value)}
              className="mb-4 w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {supplierSearchQuery.isLoading && <LoadingSpinner message="Searching..." />}
            {supplierSearchQuery.data && (
              <div className="max-h-64 overflow-y-auto rounded border">
                {supplierSearchQuery.data.results.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setSupplierId(org.id)
                      setSupplierName(org.name)
                      setSupplierModalOpen(false)
                      setSupplierKeyword('')
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{org.name}</span>
                    {org.organizationType && (
                      <span className="ml-2 text-xs text-muted-foreground">{org.organizationType}</span>
                    )}
                  </button>
                ))}
                {supplierSearchQuery.data.results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No suppliers found.</p>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSupplierModalOpen(false)}
                className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
