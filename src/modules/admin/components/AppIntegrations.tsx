import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { Tax, TaxType, TaxAppliesTo, AdminAddress } from '../types'
import type { ApiError } from '../../../shared/types'

type Tab = 'company' | 'tax'

let toastId = 0

export function AppIntegrations() {
  const [tab, setTab] = useState<Tab>('company')
  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const [taxModal, setTaxModal] = useState<Partial<Tax> | null>(null)
  const qc = useQueryClient()

  // Company info form state
  const [companyName, setCompanyName] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [address, setAddress] = useState<AdminAddress>({})
  const [configLoaded, setConfigLoaded] = useState(false)

  function showToast(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const configQ = useQuery({
    queryKey: ['global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  // Initialise company form from loaded config (once)
  if (configQ.data && !configLoaded) {
    setConfigLoaded(true)
    setCompanyName(configQ.data.companyName ?? '')
    setCompanyWebsite(configQ.data.companyWebsite ?? '')
    setAddress(configQ.data.address ?? {})
  }

  const taxQ = useQuery({
    queryKey: ['taxes'],
    queryFn: () => configService.getAllTaxes().then((r) => r.data),
  })

  const intuitTaxQ = useQuery({
    queryKey: ['intuit-taxes'],
    queryFn: () => configService.getAllIntuitTaxes().then((r) => r.data),
    enabled: tab === 'tax',
  })

  const saveCompanyMut = useMutation({
    mutationFn: () =>
      configService.saveCompanyInfo({ companyName, companyWebsite, address }).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['global-config'], data)
      showToast('Company info saved.', true)
    },
    onError: (e: { response?: { data?: ApiError } }) =>
      showToast(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const saveTaxMut = useMutation({
    mutationFn: (d: Tax) => configService.saveTax(d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taxes'] })
      setTaxModal(null)
      showToast('Tax saved.', true)
    },
    onError: (e: { response?: { data?: ApiError } }) =>
      showToast(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const inputCls = 'w-full rounded border px-3 py-1.5 text-sm'

  function addrField(field: keyof AdminAddress, label: string, colSpan?: boolean) {
    return (
      <div className={colSpan ? 'col-span-2' : ''}>
        <label className="mb-1 block text-xs">{label}</label>
        <input className={inputCls} value={(address[field] as string) ?? ''}
          onChange={(e) => setAddress((p) => ({ ...p, [field]: e.target.value }))} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <span>›</span>
        <span>App Integrations</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">App Settings &amp; Integrations</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b">
        {(['company', 'tax'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t border border-b-0 px-4 py-1.5 text-sm capitalize ${tab === t ? 'border-border bg-background font-medium' : 'hover:bg-muted'}`}>
            {t === 'company' ? 'Company Info' : 'Sales Tax'}
          </button>
        ))}
      </div>

      {/* Company Info tab */}
      {tab === 'company' && (
        <div className="max-w-xl">
          {configQ.isLoading ? <LoadingSpinner /> : (
            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block font-medium">Company Name <span className="text-destructive">*</span></label>
                <input className={inputCls} value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block font-medium">Website</label>
                <input className={inputCls} value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." />
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Address</p>
                <div className="grid grid-cols-2 gap-2">
                  {addrField('address1', 'Address 1', true)}
                  {addrField('address2', 'Address 2', true)}
                  {addrField('address3', 'Address 3', true)}
                  {addrField('city', 'City')}
                  {addrField('province', 'Province / State')}
                  {addrField('postalCode', 'Postal Code')}
                  {addrField('country', 'Country')}
                  {addrField('phone', 'Phone')}
                  {addrField('contactEmail', 'Contact Email', true)}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => saveCompanyMut.mutate()} disabled={saveCompanyMut.isPending || !companyName}
                  className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saveCompanyMut.isPending ? 'Saving...' : 'Save Company Info'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Tax tab */}
      {tab === 'tax' && (
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage tax rates applied to orders.</p>
            <button onClick={() => setTaxModal({ taxType: 'PERCENT', appliesTo: 'SUBTOTAL', amount: 0 })}
              className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
              Add Tax
            </button>
          </div>
          {taxQ.isLoading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">ISO Code</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Applies To</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {taxQ.data?.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2">{t.isoCode}</td>
                    <td className="px-3 py-2">{t.taxType}</td>
                    <td className="px-3 py-2">{t.taxType === 'PERCENT' ? `${t.amount}%` : `$${t.amount}`}</td>
                    <td className="px-3 py-2">{t.appliesTo}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setTaxModal(t)}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {!taxQ.data?.length && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No taxes configured.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tax Modal */}
      {taxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">{taxModal.id ? 'Edit' : 'New'} Tax</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block">Name <span className="text-destructive">*</span></label>
                <input className={inputCls} value={taxModal.name ?? ''}
                  onChange={(e) => setTaxModal((p) => ({ ...p!, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block">Tax Name (display)</label>
                <input className={inputCls} value={taxModal.taxName ?? ''}
                  onChange={(e) => setTaxModal((p) => ({ ...p!, taxName: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block">ISO Code</label>
                <input className={inputCls} value={taxModal.isoCode ?? ''}
                  onChange={(e) => setTaxModal((p) => ({ ...p!, isoCode: e.target.value }))} placeholder="e.g. CA-ON" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block">Type</label>
                  <select className={inputCls} value={taxModal.taxType ?? 'PERCENT'}
                    onChange={(e) => setTaxModal((p) => ({ ...p!, taxType: e.target.value as TaxType }))}>
                    <option value="PERCENT">Percent</option>
                    <option value="FLAT">Flat</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block">Amount</label>
                  <input type="number" min={0} step="0.01" className={inputCls}
                    value={taxModal.amount ?? 0}
                    onChange={(e) => setTaxModal((p) => ({ ...p!, amount: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label className="mb-1 block">Applies To</label>
                <select className={inputCls} value={taxModal.appliesTo ?? 'SUBTOTAL'}
                  onChange={(e) => setTaxModal((p) => ({ ...p!, appliesTo: e.target.value as TaxAppliesTo }))}>
                  <option value="SUBTOTAL">Subtotal</option>
                  <option value="TOTAL">Total</option>
                </select>
              </div>
              {intuitTaxQ.data && intuitTaxQ.data.length > 0 && (
                <div>
                  <label className="mb-1 block">QuickBooks Tax</label>
                  <select className={inputCls}
                    value={taxModal.qbTax?.id ?? ''}
                    onChange={(e) => {
                      const t = intuitTaxQ.data.find((x) => x.id === e.target.value)
                      setTaxModal((p) => ({ ...p!, qbTax: t ?? null }))
                    }}>
                    <option value="">— None —</option>
                    {intuitTaxQ.data.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setTaxModal(null)}
                className="rounded border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={() => {
                  if (taxModal.name && taxModal.isoCode && taxModal.taxName) {
                    saveTaxMut.mutate(taxModal as Tax)
                  }
                }}
                disabled={saveTaxMut.isPending || !taxModal.name || !taxModal.isoCode || !taxModal.taxName}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saveTaxMut.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
