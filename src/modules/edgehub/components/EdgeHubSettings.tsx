import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../../admin/services/configService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import type { ApiError } from '../../../shared/types'

let toastId = 0

export function EdgeHubSettings() {
  const [toast, setToast] = useState<{ id: number; message: string; ok: boolean } | null>(null)
  const [template, setTemplate] = useState<string | null>(null)
  const qc = useQueryClient()

  function toast_(msg: string, ok: boolean) {
    setToast({ id: ++toastId, message: msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const configQ = useQuery({
    queryKey: ['global-config'],
    queryFn: () => configService.findGlobalConfig().then((r) => r.data),
  })

  const paramMut = useMutation({
    mutationFn: (req: { name: string; value: string }) => configService.setParameter(req).then((r) => r.data),
    onSuccess: (data) => { qc.setQueryData(['global-config'], data); toast_('Saved.', true) },
    onError: (e: { response?: { data?: ApiError } }) => toast_(e.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const gc = configQ.data

  // Initialise template from loaded config if not yet set
  const displayTemplate = template ?? gc?.rfidTagTemplate ?? ''

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/edgehubs" className="hover:underline">Edge Hubs</Link>
        <span>›</span>
        <span>Settings</span>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Edge Hub Settings</h1>

      {toast && (
        <div className={`mb-4 rounded border p-3 text-sm ${toast.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {configQ.isLoading && <LoadingSpinner />}

      {gc && (
        <div className="max-w-xl space-y-6">
          <section className="rounded border p-4">
            <h2 className="mb-3 text-sm font-semibold">RFID Tag Printing</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Configure a custom ZPL II template for Zebra RFID printers. When disabled the system default template is used.
            </p>

            <div className="mb-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={!!gc.customRFIDTag}
                  onChange={() => paramMut.mutate({ name: 'customRFIDTag', value: 'true' })} />
                Use custom RFID tag template
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={!gc.customRFIDTag}
                  onChange={() => paramMut.mutate({ name: 'customRFIDTag', value: 'false' })} />
                Use system default template
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">RFID Tag Template (ZPL II)</label>
              <textarea
                rows={10}
                disabled={!gc.customRFIDTag}
                value={displayTemplate}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded border px-3 py-2 font-mono text-xs disabled:opacity-50"
                placeholder="^XA&#10;...&#10;^XZ"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => paramMut.mutate({ name: 'rfidTagTemplate', value: displayTemplate })}
                disabled={!gc.customRFIDTag || paramMut.isPending}
                className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {paramMut.isPending ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
