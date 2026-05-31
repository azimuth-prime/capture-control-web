import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { organizationService } from '../services/organizationService'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { countries } from '../../../shared/data/countries'
import type { OrgAddress, OrgContact, Organization } from '../types'
import type { ApiError } from '../../../shared/types'

type Tab = 'details' | 'addresses' | 'contacts' | 'orders' | 'invoices' | 'notes'

const orgSchema = z.object({
  name: z.string().min(1, 'Name required'),
  organizationType: z.string().min(1),
  status: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  taxIsoCode: z.string().optional(),
  currency: z.string().optional(),
})
type OrgValues = z.infer<typeof orgSchema>

const addressSchema = z.object({
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})
type AddressValues = z.infer<typeof addressSchema>

const creditSchema = z.object({
  creditLimit: z.coerce.number().optional(),
  paymentTerms: z.string().optional(),
})

const contactSchema = z.object({
  contacts: z.array(
    z.object({
      id: z.string().optional(),
      firstName: z.string().min(1, 'Required'),
      lastName: z.string().min(1, 'Required'),
      email: z.string().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
    })
  ),
})
type ContactValues = z.infer<typeof contactSchema>

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [shipToModalOpen, setShipToModalOpen] = useState(false)
  const [editingShipTo, setEditingShipTo] = useState<OrgAddress | null>(null)
  const [noteText, setNoteText] = useState('')
  const [ordersPage, setOrdersPage] = useState(0)
  const [invoicesPage, setInvoicesPage] = useState(0)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: org, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const statsQuery = useQuery({
    queryKey: ['organization', id, 'stats'],
    queryFn: () => organizationService.findCustomerStats(id!).then((r) => r.data),
    enabled: !!id && org?.organizationType !== 'SUPPLIER',
  })

  const ordersQuery = useQuery({
    queryKey: ['organization', id, 'orders', ordersPage],
    queryFn: () =>
      organizationService.findOrdersByCustomerId({
        customerId: id!,
        page: ordersPage,
        resultsPerPage: 10,
      }).then((r) => r.data),
    enabled: activeTab === 'orders' && !!id,
  })

  const invoicesQuery = useQuery({
    queryKey: ['organization', id, 'invoices', invoicesPage],
    queryFn: () =>
      organizationService.findInvoicesByCustomerId({
        customerId: id!,
        page: invoicesPage,
        resultsPerPage: 10,
      }).then((r) => r.data),
    enabled: activeTab === 'invoices' && !!id,
  })

  const paymentConfigQuery = useQuery({
    queryKey: ['admin', 'payment-config'],
    queryFn: () => configService.findPaymentConfigData().then((r) => r.data),
  })

  // --- Mutations ---
  const saveMutation = useMutation<Organization, { response?: { data?: ApiError } }, OrgValues>({
    mutationFn: (values) => organizationService.save({ id: id!, ...values }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      showToast('Organization saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveBillToMutation = useMutation<Organization, { response?: { data?: ApiError } }, AddressValues>({
    mutationFn: (values) =>
      organizationService.saveBillToAddress(id!, values as OrgAddress).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      billToForm.reset(data.billToAddress ?? {})
      showToast('Bill-to address saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveShipToMutation = useMutation<Organization, { response?: { data?: ApiError } }, OrgAddress>({
    mutationFn: (values) =>
      organizationService.saveShipToAddress(id!, values).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      setShipToModalOpen(false)
      showToast('Ship-to address saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteShipToMutation = useMutation<void, { response?: { data?: ApiError } }, string>({
    mutationFn: (addrId) => organizationService.deleteAddressById(id!, addrId).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      showToast('Address deleted.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const saveCreditMutation = useMutation({
    mutationFn: (values: { creditLimit?: number; paymentTerms?: string }) =>
      organizationService.saveCreditInfo(id!, values).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      showToast('Credit info saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveContactsMutation = useMutation<Organization, { response?: { data?: ApiError } }, OrgContact[]>({
    mutationFn: (contacts) =>
      organizationService.saveContacts(id!, contacts).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      showToast('Contacts saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveNoteMutation = useMutation({
    mutationFn: () => organizationService.saveNote(id!, { notes: noteText }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organization', id], data)
      setNoteText('')
      showToast('Note saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  // --- Forms ---
  const orgForm = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    mode: 'onTouched',
    values: org
      ? {
          name: org.name,
          organizationType: org.organizationType,
          status: org.status,
          email: org.email ?? '',
          phone: org.phone ?? '',
          website: org.website ?? '',
          taxIsoCode: org.taxIsoCode ?? '',
          currency: org.currency ?? '',
        }
      : undefined,
  })

  const billToForm = useForm<AddressValues>({
    mode: 'onTouched',
    values: org?.billToAddress
      ? {
          street: org.billToAddress.street ?? '',
          street2: org.billToAddress.street2 ?? '',
          city: org.billToAddress.city ?? '',
          province: org.billToAddress.province ?? '',
          postalCode: org.billToAddress.postalCode ?? '',
          country: org.billToAddress.country ?? '',
        }
      : undefined,
  })

  const shipToForm = useForm<AddressValues>({
    mode: 'onTouched',
  })

  const creditForm = useForm({
    resolver: zodResolver(creditSchema),
    mode: 'onTouched',
    values: org
      ? { creditLimit: org.creditLimit, paymentTerms: org.paymentTerms ?? '' }
      : undefined,
  })

  const contactsForm = useForm<ContactValues>({
    mode: 'onTouched',
    values: org ? { contacts: org.contacts ?? [] } : undefined,
  })
  const { fields, append, remove } = useFieldArray({ control: contactsForm.control, name: 'contacts' })

  const billToCountry = countries.find((c) => c.isoCode === billToForm.watch('country'))
  const shipToCountry = countries.find((c) => c.isoCode === shipToForm.watch('country'))

  if (isLoading) return <LoadingSpinner message="Loading organization..." />
  if (isError) return <ErrorMessage title="Failed to load organization" message={(error as Error).message} onRetry={refetch} />
  if (!org) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'contacts', label: 'Contacts' },
    ...(org.organizationType !== 'SUPPLIER' ? [
      { id: 'orders' as Tab, label: 'Orders' },
      { id: 'invoices' as Tab, label: 'Invoices' },
    ] : []),
    { id: 'notes', label: 'Notes' },
  ]

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/crm" className="hover:underline">Organizations</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{org.name}</li>
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
          <h1 className="text-xl font-semibold">{org.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{org.organizationType}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                org.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {org.status}
            </span>
          </div>
        </div>

        {/* Customer stats */}
        {statsQuery.data && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold">{statsQuery.data.totalOrders}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">${statsQuery.data.totalRevenue.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-destructive">${statsQuery.data.outstandingBalance.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-t border px-4 py-1.5 text-sm ${
              activeTab === t.id ? 'border-b-white bg-white font-medium' : 'hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Basic Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Basic Information</h2>
            {saveMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (saveMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Save failed.'
                  }
                />
              </div>
            )}
            <form onSubmit={orgForm.handleSubmit((v) => saveMutation.mutate(v))} noValidate>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name <span className="text-destructive">*</span></label>
                  <input type="text" {...orgForm.register('name')} className={inputCls(!!orgForm.formState.errors.name)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <select {...orgForm.register('organizationType')} className={inputCls()}>
                      <option value="CUSTOMER">Customer</option>
                      <option value="SUPPLIER">Supplier</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <select {...orgForm.register('status')} className={inputCls()}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input type="email" {...orgForm.register('email')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input type="text" {...orgForm.register('phone')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Website</label>
                  <input type="text" {...orgForm.register('website')} className={inputCls()} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tax ISO Code</label>
                    <input type="text" {...orgForm.register('taxIsoCode')} className={inputCls()} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Currency</label>
                    <select {...orgForm.register('currency')} className={inputCls()}>
                      <option value="">Default</option>
                      {paymentConfigQuery.data?.currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>

          {/* Credit Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Credit Info</h2>
            <form
              onSubmit={creditForm.handleSubmit((v) =>
                saveCreditMutation.mutate({
                  creditLimit: v.creditLimit,
                  paymentTerms: v.paymentTerms,
                })
              )}
              noValidate
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Credit Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    {...creditForm.register('creditLimit')}
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Terms</label>
                  <select {...creditForm.register('paymentTerms')} className={inputCls()}>
                    <option value="">Select terms</option>
                    <option value="NET30">Net 30</option>
                    <option value="NET60">Net 60</option>
                    <option value="NET90">Net 90</option>
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saveCreditMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveCreditMutation.isPending ? 'Saving...' : 'Save Credit Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADDRESSES TAB ── */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          {/* Bill-to */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-semibold">Bill-To Address</h2>
            {saveBillToMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (saveBillToMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Save failed.'
                  }
                />
              </div>
            )}
            <form
              onSubmit={billToForm.handleSubmit((v) => saveBillToMutation.mutate(v))}
              noValidate
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Street</label>
                  <input type="text" {...billToForm.register('street')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Street 2</label>
                  <input type="text" {...billToForm.register('street2')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">City</label>
                  <input type="text" {...billToForm.register('city')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Postal Code</label>
                  <input type="text" {...billToForm.register('postalCode')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Country</label>
                  <select {...billToForm.register('country')} className={inputCls()}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {billToCountry?.provinces && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Province / State</label>
                    <select {...billToForm.register('province')} className={inputCls()}>
                      <option value="">Select</option>
                      {billToCountry.provinces.map((p) => (
                        <option key={p.isoCode} value={p.isoCode}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saveBillToMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveBillToMutation.isPending ? 'Saving...' : 'Save Bill-To'}
                </button>
              </div>
            </form>
          </div>

          {/* Ship-to addresses */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Ship-To Addresses</h2>
              <button
                onClick={() => {
                  setEditingShipTo(null)
                  shipToForm.reset({})
                  setShipToModalOpen(true)
                }}
                className="rounded border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
              >
                Add Address
              </button>
            </div>
            {org.shipToAddress ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between rounded border p-3 text-sm">
                  <address className="not-italic text-muted-foreground">
                    {org.shipToAddress.street && <div>{org.shipToAddress.street}</div>}
                    {org.shipToAddress.city && (
                      <div>
                        {org.shipToAddress.city}, {org.shipToAddress.province} {org.shipToAddress.postalCode}
                      </div>
                    )}
                    {org.shipToAddress.country && <div>{org.shipToAddress.country}</div>}
                  </address>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingShipTo(org.shipToAddress!)
                        shipToForm.reset(org.shipToAddress!)
                        setShipToModalOpen(true)
                      }}
                      className="text-xs underline hover:no-underline"
                    >
                      Edit
                    </button>
                    {org.shipToAddress.id && (
                      <button
                        onClick={() => deleteShipToMutation.mutate(org.shipToAddress!.id!)}
                        className="text-xs text-destructive underline hover:no-underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ship-to addresses on file.</p>
            )}
          </div>
        </div>
      )}

      {/* ── CONTACTS TAB ── */}
      {activeTab === 'contacts' && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Contacts</h2>
            <button
              onClick={() => append({ firstName: '', lastName: '', email: '', phone: '', title: '' })}
              className="rounded border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
            >
              Add Contact
            </button>
          </div>
          {saveContactsMutation.isError && (
            <div className="mb-3">
              <ErrorMessage
                message={
                  (saveContactsMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                  'Save failed.'
                }
              />
            </div>
          )}
          <form
            onSubmit={contactsForm.handleSubmit((v) => saveContactsMutation.mutate(v.contacts as OrgContact[]))}
            noValidate
          >
            <div className="space-y-4">
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">No contacts. Click "Add Contact" to add one.</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="rounded border p-4">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium">Contact {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-destructive underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">First Name</label>
                      <input
                        type="text"
                        {...contactsForm.register(`contacts.${index}.firstName`)}
                        className={inputCls(!!contactsForm.formState.errors.contacts?.[index]?.firstName)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Last Name</label>
                      <input
                        type="text"
                        {...contactsForm.register(`contacts.${index}.lastName`)}
                        className={inputCls(!!contactsForm.formState.errors.contacts?.[index]?.lastName)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Email</label>
                      <input
                        type="email"
                        {...contactsForm.register(`contacts.${index}.email`)}
                        className={inputCls()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Phone</label>
                      <input
                        type="text"
                        {...contactsForm.register(`contacts.${index}.phone`)}
                        className={inputCls()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Title</label>
                      <input
                        type="text"
                        {...contactsForm.register(`contacts.${index}.title`)}
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fields.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saveContactsMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveContactsMutation.isPending ? 'Saving...' : 'Save Contacts'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Orders</h2>
          {ordersQuery.isLoading && <LoadingSpinner message="Loading orders..." />}
          {ordersQuery.isError && (
            <ErrorMessage message={(ordersQuery.error as Error).message} onRetry={ordersQuery.refetch} />
          )}
          {ordersQuery.data && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Order #</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Submitted</th>
                    <th className="py-2 pr-4">Shipped</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersQuery.data.results.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="cursor-pointer border-b hover:bg-muted/40"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">{order.id}</td>
                      <td className="py-2 pr-4">{order.state}</td>
                      <td className="py-2 pr-4">{order.submittedDate?.substring(0, 10) ?? '—'}</td>
                      <td className="py-2 pr-4">{order.shippedDate?.substring(0, 10) ?? '—'}</td>
                      <td className="py-2 text-right font-mono">${order.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {ordersQuery.data.results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-3">
                <Pagination
                  page={ordersQuery.data.page}
                  pages={ordersQuery.data.pages}
                  hasNext={ordersQuery.data.hasNext}
                  hasPrevious={ordersQuery.data.hasPrevious}
                  onPageChange={setOrdersPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {activeTab === 'invoices' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Invoices</h2>
          {invoicesQuery.isLoading && <LoadingSpinner message="Loading invoices..." />}
          {invoicesQuery.isError && (
            <ErrorMessage message={(invoicesQuery.error as Error).message} onRetry={invoicesQuery.refetch} />
          )}
          {invoicesQuery.data && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Invoice #</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Invoice Date</th>
                    <th className="py-2 pr-4">Due Date</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQuery.data.results.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoice/${inv.id}`)}
                      className="cursor-pointer border-b hover:bg-muted/40"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">{inv.id}</td>
                      <td className="py-2 pr-4">{inv.status}</td>
                      <td className="py-2 pr-4">{inv.invoiceDate?.substring(0, 10)}</td>
                      <td className="py-2 pr-4">{inv.dueDate?.substring(0, 10)}</td>
                      <td className="py-2 text-right font-mono">${inv.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {invoicesQuery.data.results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No invoices found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-3">
                <Pagination
                  page={invoicesQuery.data.page}
                  pages={invoicesQuery.data.pages}
                  hasNext={invoicesQuery.data.hasNext}
                  hasPrevious={invoicesQuery.data.hasPrevious}
                  onPageChange={setInvoicesPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {activeTab === 'notes' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold">Notes</h2>
          {/* Display existing notes as plain text — no dangerouslySetInnerHTML */}
          {org.notes && (
            <div className="mb-4 rounded border bg-muted/40 p-3">
              <pre className="whitespace-pre-wrap text-sm">{org.notes}</pre>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Add Note</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter a note..."
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => saveNoteMutation.mutate()}
              disabled={!noteText.trim() || saveNoteMutation.isPending}
              className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {saveNoteMutation.isPending ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      {/* ── SHIP-TO ADDRESS MODAL ── */}
      {shipToModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingShipTo ? 'Edit' : 'Add'} Ship-To Address</h2>
              <button onClick={() => setShipToModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {saveShipToMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (saveShipToMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Save failed.'
                  }
                />
              </div>
            )}
            <form
              onSubmit={shipToForm.handleSubmit((v) =>
                saveShipToMutation.mutate({ ...editingShipTo, ...v } as OrgAddress)
              )}
              noValidate
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Street</label>
                  <input type="text" {...shipToForm.register('street')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Street 2</label>
                  <input type="text" {...shipToForm.register('street2')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">City</label>
                  <input type="text" {...shipToForm.register('city')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Postal Code</label>
                  <input type="text" {...shipToForm.register('postalCode')} className={inputCls()} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Country</label>
                  <select {...shipToForm.register('country')} className={inputCls()}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {shipToCountry?.provinces && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Province / State</label>
                    <select {...shipToForm.register('province')} className={inputCls()}>
                      <option value="">Select</option>
                      {shipToCountry.provinces.map((p) => (
                        <option key={p.isoCode} value={p.isoCode}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShipToModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={saveShipToMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveShipToMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
