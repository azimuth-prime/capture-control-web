import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService } from '../services/userService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { Pagination } from '../../../shared/components/Pagination'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import type { ApiError } from '../../../shared/types'

const newUserSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
})
type NewUserValues = z.infer<typeof newUserSchema>

function inputCls(hasError?: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${hasError ? 'border-destructive' : ''}`
}

export function UserList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)

  const debouncedKeyword = useDebounce(keyword, 300)

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', debouncedKeyword, page],
    queryFn: () =>
      userService.search({
        keyword: debouncedKeyword.length > 0 ? debouncedKeyword.toUpperCase() : '*',
        page,
        resultsPerPage: 20,
      }).then((r) => r.data),
  })

  const createMutation = useMutation<{ id: string }, { response?: { data?: ApiError } }, NewUserValues>({
    mutationFn: (values) =>
      userService.saveUser({ ...values, status: 'ACTIVE' }).then((r) => r.data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
      form.reset()
      navigate(`/access-management/user/${user.id}`)
    },
    onError: (err) => showToast(err.response?.data?.errorMessage ?? 'Create failed.', false),
  })

  const form = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    mode: 'onTouched',
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
          <li className="font-medium text-foreground">Users</li>
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search users..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="w-full max-w-sm rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => { form.reset(); setModalOpen(true) }}
          className="rounded border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50"
        >
          New User
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Loading users..." />}
      {isError && <ErrorMessage message={(error as Error).message} onRetry={refetch} />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Roles</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/access-management/user/${user.id}`)}
                    className="cursor-pointer border-b hover:bg-muted/40"
                  >
                    <td className="px-4 py-2">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.totalResults} user{data.totalResults !== 1 ? 's' : ''}
            </p>
            <Pagination
              page={data.page}
              pages={Math.min(data.pages, 30)}
              hasNext={data.hasNext}
              hasPrevious={data.hasPrevious}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* New User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New User</h2>
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
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input type="text" {...form.register('firstName')} className={inputCls(!!form.formState.errors.firstName)} />
                  {form.formState.errors.firstName && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input type="text" {...form.register('lastName')} className={inputCls(!!form.formState.errors.lastName)} />
                  {form.formState.errors.lastName && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input type="email" {...form.register('email')} className={inputCls(!!form.formState.errors.email)} />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
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
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
