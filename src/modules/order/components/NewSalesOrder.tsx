import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { organizationService } from '../../crm/services/organizationService'
import { warehouseService } from '../../warehouse/services/warehouseService'
import { userService } from '../../crm/services/userService'
import { orderService } from '../services/orderService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { OrderAddress } from '../types'
import type { ApiError } from '../../../shared/types'

let toastId = 0

function AddressBlock({
  title,
  addr,
  onChange,
}: {
  title: string
  addr: OrderAddress
  onChange: (f: Partial<OrderAddress>) => void
}) {
  const cls = 'w-full rounded border px-3 py-1.5 text-sm'
  return (
    <div className="rounded border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs">Company Name</label>
          <input className={cls} value={addr.companyName ?? ''} onChange={(e) => onChange({ companyName: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs">Contact Name</label>
          <input className={cls} value={addr.contactName ?? ''} onChange={(e) => onChange({ contactName: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs">Address 1</label>
          <input className={cls} value={addr.address1 ?? ''} onChange={(e) => onChange({ address1: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs">Address 2</label>
          <input className={cls} value={addr.address2 ?? ''} onChange={(e) => onChange({ address2: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs">City</label>
          <input className={cls} value={addr.city ?? ''} onChange={(e) => onChange({ city: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs">Province / State</label>
          <input className={cls} value={addr.province ?? ''} onChange={(e) => onChange({ province: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs">Postal Code</label>
          <input className={cls} value={addr.postalCode ?? ''} onChange={(e) => onChange({ postalCode: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs">Country</label>
          <input className={cls} value={addr.country ?? ''} onChange={(e) => onChange({ country: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs">Phone</label>
          <input className={cls} value={addr.phone ?? ''} onChange={(e) => onChange({ phone: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

const emptyAddr = (): OrderAddress => ({})

export function NewSalesOrder() {
  const navigate = useNavigate()

  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [salesRepId, setSalesRepId] = useState('')
  const [requestedShipDate, setRequestedShipDate] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [instructions, setInstructions] = useState('')
  const [billTo, setBillTo] = useState<OrderAddress>(emptyAddr())
  const [shipTo, setShipTo] = useState<OrderAddress>(emptyAddr())
  const [sameAsShip, setSameAsShip] = useState(false)

  const [customerModal, setCustomerModal] = useState(false)
  const [customerKw, setCustomerKw] = useState('')
  const debCustomerKw = useDebounce(customerKw, 300)

  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const [formError, setFormError] = useState('')

  function showToast(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const warehouseQ = useQuery({
    queryKey: ['physical-warehouses'],
    queryFn: () => warehouseService.findAllPhysicalWarehouses().then((r) => r.data),
  })

  const salesRepQ = useQuery({
    queryKey: ['sales-users'],
    queryFn: () => userService.findSalesUsers().then((r) => r.data),
  })

  const customerSearchQ = useQuery({
    queryKey: ['customer-search', debCustomerKw],
    queryFn: () =>
      organizationService
        .search({ keyword: debCustomerKw || '*', page: 0, resultsPerPage: 10, organizationType: 'CUSTOMER' })
        .then((r) => r.data),
    enabled: customerModal,
  })

  const customerDetailQ = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => organizationService.findById(customerId).then((r) => r.data),
    enabled: !!customerId,
  })

  // Pre-populate addresses when customer loads
  const org = customerDetailQ.data
  if (org && billTo.address1 === undefined && org.billToAddress) {
    setBillTo({
      address1: org.billToAddress.street,
      address2: org.billToAddress.street2,
      city: org.billToAddress.city,
      province: org.billToAddress.province,
      postalCode: org.billToAddress.postalCode,
      country: org.billToAddress.country,
      companyName: org.name,
    })
    if (org.shipToAddress) {
      setShipTo({
        address1: org.shipToAddress.street,
        address2: org.shipToAddress.street2,
        city: org.shipToAddress.city,
        province: org.shipToAddress.province,
        postalCode: org.shipToAddress.postalCode,
        country: org.shipToAddress.country,
        companyName: org.name,
      })
    }
  }

  const createMut = useMutation({
    mutationFn: () =>
      orderService.saveOrder({
        customer: { id: customerId, name: customerName },
        warehouse: { id: warehouseId, name: '' },
        soldBy: salesRepId ? { id: salesRepId, name: '' } : undefined,
        billToAddress: billTo,
        shipToAddress: sameAsShip ? billTo : shipTo,
        requestedShipDate: requestedShipDate || null,
        poNumber: poNumber || undefined,
        instructions: instructions || undefined,
        state: 'DRAFT',
        items: [],
        suborders: [],
      }),
    onSuccess: (data) => navigate(`/order/${data.id}`),
    onError: (e: { response?: { data?: ApiError } }) => {
      const msg = e.response?.data?.errorMessage ?? 'Failed to create order.'
      setFormError(msg)
      showToast(msg, false)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!customerId) { setFormError('Please select a customer.'); return }
    if (!warehouseId) { setFormError('Please select a warehouse.'); return }
    createMut.mutate()
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <Link to="/order" className="hover:underline">Sales Orders</Link>
        <span>›</span>
        <span>New Order</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">New Sales Order</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {formError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="max-w-3xl space-y-6">

          {/* Order Info */}
          <div className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">Order Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">

              {/* Customer */}
              <div className="col-span-2">
                <label className="mb-1 block font-medium">Customer <span className="text-destructive">*</span></label>
                {customerId ? (
                  <div className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2">
                    <span>{customerName}</span>
                    <button type="button" onClick={() => { setCustomerId(''); setCustomerName(''); setBillTo(emptyAddr()); setShipTo(emptyAddr()) }}
                      className="text-xs text-destructive underline hover:no-underline">Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCustomerModal(true)}
                    className="w-full rounded border px-3 py-1.5 text-left text-muted-foreground hover:bg-muted">
                    Click to select customer...
                  </button>
                )}
              </div>

              {/* Warehouse */}
              <div>
                <label className="mb-1 block font-medium">Warehouse <span className="text-destructive">*</span></label>
                {warehouseQ.isLoading ? <LoadingSpinner /> : (
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full rounded border px-3 py-1.5">
                    <option value="">— Select —</option>
                    {warehouseQ.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                )}
              </div>

              {/* Sales Rep */}
              <div>
                <label className="mb-1 block font-medium">Sales Rep</label>
                {salesRepQ.isLoading ? <LoadingSpinner /> : (
                  <select value={salesRepId} onChange={(e) => setSalesRepId(e.target.value)}
                    className="w-full rounded border px-3 py-1.5">
                    <option value="">— None —</option>
                    {salesRepQ.data?.map((u) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Requested Ship Date */}
              <div>
                <label className="mb-1 block font-medium">Requested Ship Date</label>
                <input type="date" value={requestedShipDate} onChange={(e) => setRequestedShipDate(e.target.value)}
                  className="w-full rounded border px-3 py-1.5" />
              </div>

              {/* PO Number */}
              <div>
                <label className="mb-1 block font-medium">Customer PO #</label>
                <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full rounded border px-3 py-1.5" placeholder="Optional" />
              </div>

              {/* Instructions */}
              <div className="col-span-2">
                <label className="mb-1 block font-medium">Instructions</label>
                <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded border px-3 py-1.5" />
              </div>
            </div>
          </div>

          {/* Bill-to Address */}
          <AddressBlock title="Bill-To Address" addr={billTo}
            onChange={(f) => setBillTo((p) => ({ ...p, ...f }))} />

          {/* Same as bill-to toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sameAsShip} onChange={(e) => setSameAsShip(e.target.checked)} />
            Ship-to address same as bill-to
          </label>

          {/* Ship-to Address */}
          {!sameAsShip && (
            <AddressBlock title="Ship-To Address" addr={shipTo}
              onChange={(f) => setShipTo((p) => ({ ...p, ...f }))} />
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/order')}
              className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMut.isPending}
              className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMut.isPending ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>

      {/* Customer search modal */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Customer</h2>
              <button onClick={() => setCustomerModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <input autoFocus type="text" placeholder="Search customers..."
              value={customerKw} onChange={(e) => setCustomerKw(e.target.value)}
              className="mb-4 w-full rounded border px-3 py-1.5 text-sm" />
            {customerSearchQ.isLoading && <LoadingSpinner />}
            {customerSearchQ.data && (
              <div className="max-h-64 overflow-y-auto rounded border">
                {customerSearchQ.data.results.map((c) => (
                  <button key={c.id} type="button"
                    onClick={() => { setCustomerId(c.id); setCustomerName(c.name); setCustomerModal(false); setCustomerKw('') }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted">
                    <span className="font-medium">{c.name}</span>
                    {c.email && <span className="ml-2 text-xs text-muted-foreground">{c.email}</span>}
                  </button>
                ))}
                {customerSearchQ.data.results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No customers found.</p>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setCustomerModal(false)}
                className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
