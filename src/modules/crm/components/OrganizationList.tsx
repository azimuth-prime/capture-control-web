import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { organizationService } from '../services/organizationService'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'

const newOrgSchema = z.object({
  name: z.string().min(1, 'Name required'),
  organizationType: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']),
  currency: z.string().optional(),
})
type NewOrgValues = z.infer<typeof newOrgSchema>

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function OrganizationList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [orgType, setOrgType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)

  const debouncedKeyword = useDebounce(keyword, 300)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organizations', debouncedKeyword, page, orgType],
    queryFn: () =>
      organizationService.search({
        keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : '*',
        page,
        resultsPerPage: 30,
        organizationType: orgType === 'ALL' ? undefined : orgType,
      }).then((r) => r.data),
  })

  // configService.findPaymentConfigData() used here — not direct axiosInstance in component
  const paymentConfigQuery = useQuery({
    queryKey: ['admin', 'payment-config'],
    queryFn: () => configService.findPaymentConfigData().then((r) => r.data),
  })

  const createMutation = useMutation<{ id: string }, { response?: { data?: ApiError } }, NewOrgValues>({
    mutationFn: (values) =>
      organizationService.save({
        name: values.name,
        organizationType: values.organizationType,
        currency: values.currency,
        status: 'ACTIVE',
      }).then((r) => r.data),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setModalOpen(false)
      form.reset()
      navigate(`/crm/${org.id}`)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Create failed.', false),
  })

  const form = useForm<NewOrgValues>({
    resolver: zodResolver(newOrgSchema),
    mode: 'onTouched',
    defaultValues: { organizationType: 'CUSTOMER' },
  })

  function handleKeywordChange(value: string) {
    setKeyword(value)
    setPage(0)
  }

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">Organizations</li>
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search organizations..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-1">
          {(['ALL', 'CUSTOMER', 'SUPPLIER'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setOrgType(t); setPage(0) }}
              className={`rounded border px-3 py-1.5 text-sm ${
                orgType === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => { form.reset({ organizationType: 'CUSTOMER' }); setModalOpen(true) }}
          className="ml-auto rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New Organization
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading organizations..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => navigate(`/crm/${org.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2 font-medium">{org.name}</td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">
                        {org.organizationType}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          org.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{org.email ?? '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">{org.phone ?? '—'}</td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} organization{data.totalResults !== 1 ? 's' : ''}
            </p>
            <Pagination
              page={data.page}
              pages={Math.min(data.pages, 20)}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* New Organization Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Organization</h2>
              <button onClick={() => setModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>
            {createMutation.isError && (
              <div className="mb-3">
                <ErrorMessage
                  message={
                    (createMutation.error as { response?: { data?: ApiError } }).response?.data?.errorMessage ??
                    'Create failed.'
                  }
                />
              </div>
            )}
            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} noValidate>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input type="text" {...form.register('name')} className={inputCls(!!form.formState.errors.name)} />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <select {...form.register('organizationType')} className={inputCls()}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                  {paymentConfigQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading currencies...</p>
                  ) : (
                    <select {...form.register('currency')} className={inputCls()}>
                      <option value="">Default</option>
                      {paymentConfigQuery.data?.currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.symbol ? `(${c.symbol})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
