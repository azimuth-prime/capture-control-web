import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../../auth/useAuth'
import { configService } from '../services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { countries } from '../../../shared/data/countries'
import type { Currency, Tax, LogLevel } from '../types'
import type { ApiError } from '../../../shared/types'

type Tab = 'currencies' | 'company' | 'printer' | 'integration' | 'logging' | 'password' | 'taxes'

const currencySchema = z.object({
  code: z.string().min(1, 'Code required').max(10),
  name: z.string().min(1, 'Name required'),
  symbol: z.string().min(1, 'Symbol required'),
})
type CurrencyValues = z.infer<typeof currencySchema>

const taxSchema = z.object({
  isoCode: z.string().min(1, 'ISO code required'),
  name: z.string().min(1, 'Name required'),
  taxName: z.string().min(1, 'Tax name required'),
  taxType: z.enum(['PERCENT', 'FLAT']),
  amount: z.coerce.number().min(0),
  appliesTo: z.enum(['SUBTOTAL', 'TOTAL']),
})
type TaxValues = z.infer<typeof taxSchema>

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function AdminConfig() {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('SUPER_ADMIN')
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('currencies')
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  const [taxModalOpen, setTaxModalOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)
  const [adminPwResult, setAdminPwResult] = useState<string | null>(null)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  // --- Data queries ---
  const paymentQuery = useQuery({
    queryKey: ['admin', 'payment-config'],
    queryFn: () => configService.findPaymentConfigData().then((r) => r.data),
  })

  const globalQuery = useQuery({
    queryKey: ['admin', 'global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  const qbQuery = useQuery({
    queryKey: ['admin', 'qb-info'],
    queryFn: () => configService.getIntuitData().then((r) => r.data),
    enabled: !!globalQuery.data?.qboEnabled,
  })

  const loggingQuery = useQuery({
    queryKey: ['admin', 'logging'],
    queryFn: () => configService.getLoggingLevel().then((r) => r.data),
    enabled: activeTab === 'logging',
  })

  const taxQuery = useQuery({
    queryKey: ['admin', 'taxes'],
    queryFn: () => configService.getAllTaxes().then((r) => r.data),
    enabled: activeTab === 'taxes',
  })

  useQuery({
    queryKey: ['admin', 'intuit-taxes'],
    queryFn: () => configService.getAllIntuitTaxes().then((r) => r.data),
    enabled: activeTab === 'taxes' && !!globalQuery.data?.qboEnabled,
  })

  // --- Mutations ---
  const saveCurrencyMutation = useMutation<Currency, { response?: { data?: ApiError } }, Currency>({
    mutationFn: (data) => configService.saveCurrency(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-config'] })
      setCurrencyModalOpen(false)
      currencyForm.reset()
      showToast('Currency saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const deleteCurrencyMutation = useMutation<void, { response?: { data?: ApiError } }, string>({
    mutationFn: (id) => configService.deleteCurrencyById(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-config'] })
      showToast('Currency deleted.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Delete failed.', false),
  })

  const saveCompanyMutation = useMutation({
    mutationFn: () => {
      const gc = globalQuery.data!
      return configService.saveCompanyInfo({
        companyName: gc.companyName ?? '',
        companyWebsite: gc.companyWebsite,
        address: gc.address ?? {},
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'global-config'], data)
      showToast('Company info saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const savePrinterMutation = useMutation({
    mutationFn: () => {
      const gc = globalQuery.data!
      return configService.saveProductLabelPrinterInfo({
        url: gc.productLabelPrinterURL ?? '',
        type: gc.productLabelPrinterType,
        labelTemplate: gc.productLabelTemplate,
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'global-config'], data)
      showToast('Printer info saved.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const setLoggingMutation = useMutation<void, { response?: { data?: ApiError } }, LogLevel>({
    mutationFn: (level) => configService.setLoggingLevel({ configuredLevel: level }).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'logging'] })
      showToast('Logging level updated.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Update failed.', false),
  })

  const adminPasswordMutation = useMutation<void, { response?: { data?: ApiError } }, string>({
    mutationFn: (password) => configService.resetAdminPassword({ password }).then(() => undefined),
    onSuccess: () => {
      setAdminPwResult('Password updated. Use this password on next login.')
      adminPwForm.reset()
    },
    onError: (err) => {
      setAdminPwResult(null)
      showToast(err.response?.data?.errorMessage ?? 'Reset failed.', false)
    },
  })

  const saveTaxMutation = useMutation<Tax, { response?: { data?: ApiError } }, Tax>({
    mutationFn: (data) => configService.saveTax(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'taxes'] })
      setTaxModalOpen(false)
      taxForm.reset()
      showToast('Tax saved.', true)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const removeIntuitMutation = useMutation({
    mutationFn: () => configService.removeIntuitAccount().then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-config'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'qb-info'] })
      showToast('Intuit account removed.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Remove failed.', false),
  })

  // --- Forms ---
  const currencyForm = useForm<CurrencyValues>({
    resolver: zodResolver(currencySchema),
    mode: 'onTouched',
  })

  const taxForm = useForm<TaxValues>({
    resolver: zodResolver(taxSchema),
    mode: 'onTouched',
  })

  const adminPwForm = useForm<{ password: string }>({
    defaultValues: { password: '' },
    mode: 'onTouched',
  })

  function openCurrencyModal(currency?: Currency) {
    setEditingCurrency(currency ?? null)
    currencyForm.reset(currency ?? { code: '', name: '', symbol: '' })
    setCurrencyModalOpen(true)
  }

  function openTaxModal(tax?: Tax) {
    setEditingTax(tax ?? null)
    taxForm.reset(tax ?? { isoCode: '', name: '', taxName: '', taxType: 'PERCENT', amount: 0, appliesTo: 'SUBTOTAL' })
    setTaxModalOpen(true)
  }

  const selectedCountry = countries.find((c) => c.isoCode === globalQuery.data?.address?.country)

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'currencies', label: 'Currencies' },
    { id: 'company', label: 'Company Info' },
    { id: 'printer', label: 'Label Printer' },
    { id: 'integration', label: 'Integration' },
    { id: 'logging', label: 'Logging' },
    { id: 'password', label: 'Admin Password', adminOnly: true },
    { id: 'taxes', label: 'Taxes' },
  ]

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Admin Settings</li>
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

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {tabs
          .filter((t) => !t.adminOnly || isSuperAdmin)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-t border px-4 py-1.5 text-sm ${
                activeTab === t.id
                  ? 'border-b-white bg-white font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* ── CURRENCIES ── */}
      {activeTab === 'currencies' && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Currencies</h2>
            <button
              onClick={() => openCurrencyModal()}
              className="rounded border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
            >
              Add Currency
            </button>
          </div>
          {paymentQuery.isLoading && <LoadingSpinner message="Loading currencies..." />}
          {paymentQuery.isError && (
            <ErrorMessage message={(paymentQuery.error as Error).message} onRetry={paymentQuery.refetch} />
          )}
          {paymentQuery.data && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Symbol</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {paymentQuery.data.currencies.map((c) => (
                  <tr key={c.id ?? c.code} className="border-b hover:bg-muted/40">
                    <td className="py-2 pr-4 font-mono">{c.code}</td>
                    <td className="py-2 pr-4">{c.name}</td>
                    <td className="py-2 pr-4">{c.symbol}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCurrencyModal(c)}
                          className="text-xs underline hover:no-underline"
                        >
                          Edit
                        </button>
                        {c.id && (
                          <button
                            onClick={() => deleteCurrencyMutation.mutate(c.id!)}
                            className="text-xs text-destructive underline hover:no-underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── COMPANY INFO ── */}
      {activeTab === 'company' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Company Info</h2>
          {globalQuery.isLoading && <LoadingSpinner message="Loading..." />}
          {globalQuery.isError && (
            <ErrorMessage message={(globalQuery.error as Error).message} onRetry={globalQuery.refetch} />
          )}
          {saveCompanyMutation.isError && (
            <div className="mb-4">
              <ErrorMessage
                message={
                  (saveCompanyMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                  'Save failed.'
                }
              />
            </div>
          )}
          {globalQuery.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    value={globalQuery.data.companyName ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        companyName: e.target.value,
                      })
                    }
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Website</label>
                  <input
                    type="text"
                    value={globalQuery.data.companyWebsite ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        companyWebsite: e.target.value,
                      })
                    }
                    className={inputCls()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Address</label>
                  <input
                    type="text"
                    placeholder="Street"
                    value={globalQuery.data.address?.address1 ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        address: { ...globalQuery.data!.address, address1: e.target.value },
                      })
                    }
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">City</label>
                  <input
                    type="text"
                    value={globalQuery.data.address?.city ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        address: { ...globalQuery.data!.address, city: e.target.value },
                      })
                    }
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Country</label>
                  <select
                    value={globalQuery.data.address?.country ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        address: { ...globalQuery.data!.address, country: e.target.value, province: '' },
                      })
                    }
                    className={inputCls()}
                  >
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCountry?.provinces && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Province / State</label>
                    <select
                      value={globalQuery.data.address?.province ?? ''}
                      onChange={(e) =>
                        queryClient.setQueryData(['admin', 'global-config'], {
                          ...globalQuery.data,
                          address: { ...globalQuery.data!.address, province: e.target.value },
                        })
                      }
                      className={inputCls()}
                    >
                      <option value="">Select province</option>
                      {selectedCountry.provinces.map((p) => (
                        <option key={p.isoCode} value={p.isoCode}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">Postal Code</label>
                  <input
                    type="text"
                    value={globalQuery.data.address?.postalCode ?? ''}
                    onChange={(e) =>
                      queryClient.setQueryData(['admin', 'global-config'], {
                        ...globalQuery.data,
                        address: { ...globalQuery.data!.address, postalCode: e.target.value },
                      })
                    }
                    className={inputCls()}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveCompanyMutation.mutate()}
                  disabled={saveCompanyMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveCompanyMutation.isPending ? 'Saving...' : 'Save Company Info'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LABEL PRINTER ── */}
      {activeTab === 'printer' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Product Label Printer</h2>
          {globalQuery.isLoading && <LoadingSpinner message="Loading..." />}
          {globalQuery.isError && (
            <ErrorMessage message={(globalQuery.error as Error).message} onRetry={globalQuery.refetch} />
          )}
          {savePrinterMutation.isError && (
            <div className="mb-4">
              <ErrorMessage
                message={
                  (savePrinterMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                  'Save failed.'
                }
              />
            </div>
          )}
          {globalQuery.data && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Printer URL</label>
                <input
                  type="text"
                  value={globalQuery.data.productLabelPrinterURL ?? ''}
                  onChange={(e) =>
                    queryClient.setQueryData(['admin', 'global-config'], {
                      ...globalQuery.data,
                      productLabelPrinterURL: e.target.value,
                    })
                  }
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Printer Type</label>
                <input
                  type="text"
                  value={globalQuery.data.productLabelPrinterType ?? ''}
                  onChange={(e) =>
                    queryClient.setQueryData(['admin', 'global-config'], {
                      ...globalQuery.data,
                      productLabelPrinterType: e.target.value,
                    })
                  }
                  className={inputCls()}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Label Template</label>
                <input
                  type="text"
                  value={globalQuery.data.productLabelTemplate ?? ''}
                  onChange={(e) =>
                    queryClient.setQueryData(['admin', 'global-config'], {
                      ...globalQuery.data,
                      productLabelTemplate: e.target.value,
                    })
                  }
                  className={inputCls()}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => savePrinterMutation.mutate()}
                  disabled={savePrinterMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {savePrinterMutation.isPending ? 'Saving...' : 'Save Printer Info'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INTEGRATION ── */}
      {activeTab === 'integration' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">QuickBooks Integration</h2>
          {globalQuery.isLoading && <LoadingSpinner message="Loading..." />}
          {globalQuery.data && !globalQuery.data.qboEnabled && (
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              QuickBooks Online is not enabled. Enable it in global config to manage integration settings.
            </div>
          )}
          {globalQuery.data?.qboEnabled && (
            <>
              {qbQuery.isLoading && <LoadingSpinner message="Loading QB data..." />}
              {qbQuery.isError && (
                <ErrorMessage message={(qbQuery.error as Error).message} onRetry={qbQuery.refetch} />
              )}
              {qbQuery.data && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-medium">Sales Account:</span> {qbQuery.data.salesAccount ?? '—'}</div>
                    <div><span className="font-medium">Expense Account:</span> {qbQuery.data.expenseAccount ?? '—'}</div>
                    <div><span className="font-medium">Asset Account:</span> {qbQuery.data.assetAccount ?? '—'}</div>
                    <div><span className="font-medium">Shipping Account:</span> {qbQuery.data.shippingAccount ?? '—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeIntuitMutation.mutate()}
                      disabled={removeIntuitMutation.isPending}
                      className="rounded border border-destructive px-3 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    >
                      {removeIntuitMutation.isPending ? 'Removing...' : 'Remove Intuit Account'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LOGGING ── */}
      {activeTab === 'logging' && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Logging</h2>
          {loggingQuery.isLoading && <LoadingSpinner message="Loading..." />}
          {loggingQuery.isError && (
            <ErrorMessage message={(loggingQuery.error as Error).message} onRetry={loggingQuery.refetch} />
          )}
          {setLoggingMutation.isError && (
            <div className="mb-4">
              <ErrorMessage
                message={
                  (setLoggingMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                  'Update failed.'
                }
              />
            </div>
          )}
          {loggingQuery.data && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Log Level</label>
                <p className="mb-1 text-xs text-muted-foreground">
                  Effective: {loggingQuery.data.effectiveLevel}
                </p>
                <div className="flex gap-2">
                  {(['DEBUG', 'INFO', 'WARN', 'ERROR'] as LogLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setLoggingMutation.mutate(level)}
                      disabled={setLoggingMutation.isPending}
                      className={`rounded border px-3 py-1 text-sm disabled:opacity-40 ${
                        loggingQuery.data.configuredLevel === level
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN PASSWORD (SUPER_ADMIN only) ── */}
      {activeTab === 'password' && isSuperAdmin && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Admin Password</h2>
          {adminPasswordMutation.isError && (
            <div className="mb-4">
              <ErrorMessage
                message={
                  (adminPasswordMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                  'Reset failed.'
                }
              />
            </div>
          )}
          {adminPwResult && (
            <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
              {adminPwResult}
            </div>
          )}
          <form
            onSubmit={adminPwForm.handleSubmit((v) => adminPasswordMutation.mutate(v.password))}
            noValidate
          >
            <div className="max-w-sm space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">New Password</label>
                <input
                  type="password"
                  {...adminPwForm.register('password', { required: true })}
                  className={inputCls()}
                />
              </div>
              <button
                type="submit"
                disabled={adminPasswordMutation.isPending}
                className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                {adminPasswordMutation.isPending ? 'Saving...' : 'Set Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAXES ── */}
      {activeTab === 'taxes' && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Taxes</h2>
            <button
              onClick={() => openTaxModal()}
              className="rounded border border-green-600 px-3 py-1 text-sm text-green-700 hover:bg-green-50"
            >
              Add Tax
            </button>
          </div>
          {taxQuery.isLoading && <LoadingSpinner message="Loading taxes..." />}
          {taxQuery.isError && (
            <ErrorMessage message={(taxQuery.error as Error).message} onRetry={taxQuery.refetch} />
          )}
          {taxQuery.data && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">ISO</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Applies To</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {taxQuery.data.map((tax) => (
                  <tr key={tax.id} className="border-b hover:bg-muted/40">
                    <td className="py-2 pr-4">{tax.name}</td>
                    <td className="py-2 pr-4 font-mono">{tax.isoCode}</td>
                    <td className="py-2 pr-4">{tax.taxType}</td>
                    <td className="py-2 pr-4">{tax.taxType === 'PERCENT' ? `${tax.amount}%` : `$${tax.amount}`}</td>
                    <td className="py-2 pr-4">{tax.appliesTo}</td>
                    <td className="py-2">
                      <button
                        onClick={() => openTaxModal(tax)}
                        className="text-xs underline hover:no-underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CURRENCY MODAL ── */}
      {currencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingCurrency ? 'Edit Currency' : 'Add Currency'}</h2>
              <button onClick={() => setCurrencyModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            <form
              onSubmit={currencyForm.handleSubmit((v) =>
                saveCurrencyMutation.mutate({ ...editingCurrency, ...v })
              )}
              noValidate
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Code</label>
                  <input type="text" {...currencyForm.register('code')} className={inputCls(!!currencyForm.formState.errors.code)} />
                  {currencyForm.formState.errors.code && <p className="mt-1 text-xs text-destructive">{currencyForm.formState.errors.code.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input type="text" {...currencyForm.register('name')} className={inputCls(!!currencyForm.formState.errors.name)} />
                  {currencyForm.formState.errors.name && <p className="mt-1 text-xs text-destructive">{currencyForm.formState.errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Symbol</label>
                  <input type="text" {...currencyForm.register('symbol')} className={inputCls(!!currencyForm.formState.errors.symbol)} />
                  {currencyForm.formState.errors.symbol && <p className="mt-1 text-xs text-destructive">{currencyForm.formState.errors.symbol.message}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setCurrencyModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={saveCurrencyMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveCurrencyMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAX MODAL ── */}
      {taxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingTax ? 'Edit Tax' : 'Add Tax'}</h2>
              <button onClick={() => setTaxModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {saveTaxMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (saveTaxMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Save failed.'
                  }
                />
              </div>
            )}
            <form
              onSubmit={taxForm.handleSubmit((v) =>
                saveTaxMutation.mutate({ ...editingTax, ...v } as Tax)
              )}
              noValidate
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">ISO Code</label>
                  <input type="text" {...taxForm.register('isoCode')} className={inputCls(!!taxForm.formState.errors.isoCode)} />
                  {taxForm.formState.errors.isoCode && <p className="mt-1 text-xs text-destructive">{taxForm.formState.errors.isoCode.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input type="text" {...taxForm.register('name')} className={inputCls(!!taxForm.formState.errors.name)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Tax Name</label>
                  <input type="text" {...taxForm.register('taxName')} className={inputCls(!!taxForm.formState.errors.taxName)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <select {...taxForm.register('taxType')} className={inputCls()}>
                      <option value="PERCENT">Percent</option>
                      <option value="FLAT">Flat</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Amount</label>
                    <input type="number" step="0.01" {...taxForm.register('amount')} className={inputCls(!!taxForm.formState.errors.amount)} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Applies To</label>
                  <select {...taxForm.register('appliesTo')} className={inputCls()}>
                    <option value="SUBTOTAL">Subtotal</option>
                    <option value="TOTAL">Total</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setTaxModalOpen(false)} className="rounded border px-4 py-1.5 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={saveTaxMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {saveTaxMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
