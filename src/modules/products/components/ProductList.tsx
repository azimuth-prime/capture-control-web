import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ProductType, ControlType } from '../types'
import type { ApiError } from '../../../shared/types'

const PRODUCT_TYPES: ProductType[] = ['FINISHED', 'COMPONENT', 'SERVICE', 'OTHER']
const CONTROL_TYPES: ControlType[] = ['LOT', 'SERIAL']
const RESULTS_PER_PAGE = 20

interface NewProductForm {
  name: string
  description: string
  altId: string
  productType: ProductType
  controlType: ControlType
  availabilityDate: string
  taxable: boolean
  stockUnit: string
}

const EMPTY_FORM: NewProductForm = {
  name: '',
  description: '',
  altId: '',
  productType: 'FINISHED',
  controlType: 'LOT',
  availabilityDate: '',
  taxable: false,
  stockUnit: 'EACH',
}

export function ProductList() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const debouncedKeyword = useDebounce(keyword, 300)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewProductForm>(EMPTY_FORM)
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', debouncedKeyword, page],
    queryFn: () =>
      productService
        .findByKeyword({ keyword: debouncedKeyword, page, resultsPerPage: RESULTS_PER_PAGE })
        .then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: () => productService.save(form).then((r) => r.data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowModal(false)
      setForm(EMPTY_FORM)
      showToast(`Product "${saved.name}" created.`, true)
    },
    onError: (err: ApiError) => showToast(err.errorMessage ?? 'Failed to create product.', false),
  })

  const pages = Math.min(data?.pages ?? 1, 20)

  return (
    <div className="p-4">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded p-3 text-sm text-white ${toast.success ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }}
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          New Product
        </button>
      </div>

      <input
        type="text"
        placeholder="Search products..."
        value={keyword}
        onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
        className="mb-4 w-full rounded border px-3 py-2 text-sm"
      />

      {isLoading && <LoadingSpinner />}
      {isError && (
        <ErrorMessage
          message={(error as unknown as ApiError)?.errorMessage ?? 'Failed to load products.'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">Image</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Alt ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Warehouses</th>
                  <th className="px-3 py-2 text-right">On Hand</th>
                  <th className="px-3 py-2 text-right">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.results.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/products/${p.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {p.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.altId ?? '—'}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                      {p.description}
                    </td>
                    <td className="px-3 py-2">{p.productType ?? '—'}</td>
                    <td className="px-3 py-2">{p.warehouses?.join(', ') ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{p.onHand?.toLocaleString() ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {p.available?.toLocaleString() ?? '—'}
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Pagination
              page={page}
              pages={pages}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">New Product</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Alt ID</label>
                <input
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  value={form.altId}
                  onChange={(e) => setForm((f) => ({ ...f, altId: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded border px-3 py-1.5 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Product Type</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={form.productType}
                    onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value as ProductType }))}
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Control Type</label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={form.controlType}
                    onChange={(e) => setForm((f) => ({ ...f, controlType: e.target.value as ControlType }))}
                  >
                    {CONTROL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Availability Date</label>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={form.availabilityDate}
                    onChange={(e) => setForm((f) => ({ ...f, availabilityDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock Unit</label>
                  <input
                    className="w-full rounded border px-3 py-1.5 text-sm"
                    value={form.stockUnit}
                    onChange={(e) => setForm((f) => ({ ...f, stockUnit: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxable"
                  checked={form.taxable}
                  onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.checked }))}
                />
                <label htmlFor="taxable" className="text-sm">
                  Taxable
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || saveMutation.isPending}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
