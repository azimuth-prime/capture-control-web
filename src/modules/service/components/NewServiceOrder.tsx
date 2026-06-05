import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { organizationService } from '../../crm/services/organizationService'
import { warehouseService } from '../../warehouse/services/warehouseService'
import { serviceService } from '../services/serviceService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'

export function NewServiceOrder() {
  const navigate = useNavigate()

  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [requestedByDate, setRequestedByDate] = useState('')
  const [notes, setNotes] = useState('')

  const [supplierModal, setSupplierModal] = useState(false)
  const [supplierKw, setSupplierKw] = useState('')
  const debSupplierKw = useDebounce(supplierKw, 300)

  const [formError, setFormError] = useState('')

  const warehouseQ = useQuery({
    queryKey: ['physical-warehouses'],
    queryFn: () => warehouseService.findAllPhysicalWarehouses().then((r) => r.data),
  })

  const supplierSearchQ = useQuery({
    queryKey: ['supplier-search', debSupplierKw],
    queryFn: () =>
      organizationService
        .search({ keyword: debSupplierKw || '*', page: 0, resultsPerPage: 10, organizationType: 'SUPPLIER' })
        .then((r) => r.data),
    enabled: supplierModal,
  })

  const createMut = useMutation({
    mutationFn: () =>
      serviceService.save({
        supplier: { id: supplierId, name: supplierName },
        warehouse: { id: warehouseId, name: '' },
        requestedByDate: requestedByDate || null,
        notes: notes || undefined,
        items: [],
        invoices: [],
        state: 'DRAFT',
      }).then((r) => r.data),
    onSuccess: (data) => navigate(`/serviceorder/${data.id}`),
    onError: (e: { response?: { data?: ApiError } }) =>
      setFormError(e.response?.data?.errorMessage ?? 'Failed to create service order.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!supplierId) { setFormError('Please select a supplier.'); return }
    if (!warehouseId) { setFormError('Please select a warehouse.'); return }
    createMut.mutate()
  }

  const inputCls = 'w-full rounded border px-3 py-1.5 text-sm'

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <Link to="/serviceorder" className="hover:underline">Service Orders</Link>
        <span>›</span>
        <span>New Service Order</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">New Service Order</h1>

      {formError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="max-w-lg space-y-4 text-sm">

          {/* Supplier */}
          <div>
            <label className="mb-1 block font-medium">Supplier <span className="text-destructive">*</span></label>
            {supplierId ? (
              <div className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2">
                <span>{supplierName}</span>
                <button type="button" onClick={() => { setSupplierId(''); setSupplierName('') }}
                  className="text-xs text-destructive underline hover:no-underline">Change</button>
              </div>
            ) : (
              <button type="button" onClick={() => setSupplierModal(true)}
                className="w-full rounded border px-3 py-1.5 text-left text-muted-foreground hover:bg-muted">
                Click to select supplier...
              </button>
            )}
          </div>

          {/* Warehouse */}
          <div>
            <label className="mb-1 block font-medium">Warehouse <span className="text-destructive">*</span></label>
            {warehouseQ.isLoading ? <LoadingSpinner /> : (
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputCls}>
                <option value="">— Select warehouse —</option>
                {warehouseQ.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>

          {/* Requested By Date */}
          <div>
            <label className="mb-1 block font-medium">Requested By Date</label>
            <input type="date" value={requestedByDate} onChange={(e) => setRequestedByDate(e.target.value)}
              className={inputCls} />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block font-medium">Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              className={inputCls} placeholder="Optional notes..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/serviceorder')}
              className="rounded border px-4 py-1.5 hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMut.isPending}
              className="rounded bg-primary px-4 py-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMut.isPending ? 'Creating...' : 'Create Service Order'}
            </button>
          </div>
        </div>
      </form>

      {/* Supplier search modal */}
      {supplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Supplier</h2>
              <button onClick={() => setSupplierModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <input autoFocus type="text" placeholder="Search suppliers..."
              value={supplierKw} onChange={(e) => setSupplierKw(e.target.value)}
              className="mb-4 w-full rounded border px-3 py-1.5 text-sm" />
            {supplierSearchQ.isLoading && <LoadingSpinner />}
            {supplierSearchQ.data && (
              <div className="max-h-64 overflow-y-auto rounded border">
                {supplierSearchQ.data.results.map((s) => (
                  <button key={s.id} type="button"
                    onClick={() => { setSupplierId(s.id); setSupplierName(s.name); setSupplierModal(false); setSupplierKw('') }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted">
                    <span className="font-medium">{s.name}</span>
                    {s.email && <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>}
                  </button>
                ))}
                {supplierSearchQ.data.results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No suppliers found.</p>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSupplierModal(false)}
                className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
