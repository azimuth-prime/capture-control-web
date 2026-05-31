import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { ApiError } from '../../../shared/types'

type Tab = 'printer' | 'color-swatches' | 'sizing' | 'stock-units'

export function AppConfig() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('printer')
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const globalQuery = useQuery({
    queryKey: ['admin', 'global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  const savePrinterMutation = useMutation({
    mutationFn: () => {
      const gc = globalQuery.data!
      return configService.saveProductLabelPrinterInfo({
        url: gc.productLabelPrinterURL ?? '',
        labelTemplate: gc.productLabelTemplate,
      }).then((r) => r.data)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'global-config'], data)
      showToast('Printer info updated.', true)
    },
    onError: (err: { response?: { data?: ApiError } }) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  function inputCls() {
    return 'w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'printer', label: 'Label Printer' },
    { id: 'color-swatches', label: 'Color Swatches' },
    { id: 'sizing', label: 'Sizing' },
    { id: 'stock-units', label: 'Stock Units' },
  ]

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">App Config</li>
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
            <div className="max-w-md space-y-4">
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

      {/* ── STUBS for sections requiring products module ── */}
      {(activeTab === 'color-swatches' || activeTab === 'sizing' || activeTab === 'stock-units') && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
          <p className="text-sm text-muted-foreground">
            This section will be available after the Products module is migrated.
          </p>
        </div>
      )}
    </div>
  )
}
