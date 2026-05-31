import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService } from '../services/userService'
import { useAuth } from '../../../auth/useAuth'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { ApiError } from '../../../shared/types'

const myAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').max(20, '20 characters maximum'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type MyAccountValues = z.infer<typeof myAccountSchema>
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function inputCls(hasError: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
    hasError ? 'border-destructive' : ''
  }`
}

export function MyAccount() {
  const queryClient = useQueryClient()
  const setCurrentUser = useAuth((s) => s.setCurrentUser)

  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const {
    data: currentUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser().then((r) => r.data),
  })

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const saveMutation = useMutation<void, { response?: { data?: ApiError } }, MyAccountValues>({
    mutationFn: (data) =>
      userService
        .saveUser({ ...currentUser, firstName: data.firstName, lastName: data.lastName })
        .then(() => undefined),
    onSuccess: async () => {
      const refreshed = await userService.getCurrentUser()
      queryClient.setQueryData(['currentUser'], refreshed.data)
      setCurrentUser({
        id: refreshed.data.id,
        email: refreshed.data.email,
        firstName: refreshed.data.firstName,
        lastName: refreshed.data.lastName,
        roles: refreshed.data.roles,
      })
      showToast('Account information saved.', true)
    },
    onError: (err) =>
      showToast(err.response?.data?.errorMessage ?? 'Save failed.', false),
  })

  const resetPasswordMutation = useMutation<
    void,
    { response?: { data?: ApiError } },
    ResetPasswordValues
  >({
    mutationFn: (data) =>
      userService
        .resetPassword({ id: currentUser!.id, password: data.password })
        .then(() => undefined),
    onSuccess: () => {
      setResetModalOpen(false)
      resetForm.reset()
      showToast('Password has been reset.', true)
    },
    onError: (err) => setResetError(err.response?.data?.errorMessage ?? 'Reset failed.'),
  })

  const accountForm = useForm<MyAccountValues>({
    resolver: zodResolver(myAccountSchema),
    mode: 'onTouched',
    values: currentUser
      ? { firstName: currentUser.firstName, lastName: currentUser.lastName }
      : undefined,
  })

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
  })

  if (isLoading) return <LoadingSpinner message="Loading account..." />
  if (isError)
    return (
      <ErrorMessage
        title="Failed to load account"
        message={(error as Error).message}
        onRetry={refetch}
      />
    )
  if (!currentUser) return null

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">My Account</li>
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

      <div className="rounded-lg border bg-card p-6">
        <form
          onSubmit={accountForm.handleSubmit((v) => saveMutation.mutate(v))}
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </label>
              <p className="mb-1 text-xs text-muted-foreground">Your first name.</p>
              <input
                type="text"
                {...accountForm.register('firstName')}
                className={inputCls(!!accountForm.formState.errors.firstName)}
              />
              {accountForm.formState.errors.firstName && (
                <p className="mt-1 text-xs text-destructive">
                  {accountForm.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </label>
              <p className="mb-1 text-xs text-muted-foreground">Your last name.</p>
              <input
                type="text"
                {...accountForm.register('lastName')}
                className={inputCls(!!accountForm.formState.errors.lastName)}
              />
              {accountForm.formState.errors.lastName && (
                <p className="mt-1 text-xs text-destructive">
                  {accountForm.formState.errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <p className="mb-1 text-xs text-muted-foreground">Used for login. Cannot be changed here.</p>
              <input
                disabled
                value={currentUser.email}
                className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Creation Date</label>
              <p className="mb-1 text-xs text-muted-foreground">Date your account was created.</p>
              <input
                disabled
                value={currentUser.creationDate?.substring(0, 10) ?? ''}
                className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Last Modified Date</label>
              <p className="mb-1 text-xs text-muted-foreground">Date of last account update.</p>
              <input
                disabled
                value={currentUser.lastModifiedDate?.substring(0, 10) ?? ''}
                className="w-full rounded border bg-muted px-3 py-1.5 text-sm"
              />
            </div>

          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResetError(null)
                resetForm.reset()
                setResetModalOpen(true)
              }}
              className="rounded border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Reset Password
            </button>
            <button
              type="submit"
              disabled={!accountForm.formState.isValid || saveMutation.isPending}
              className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button onClick={() => setResetModalOpen(false)} className="text-destructive hover:opacity-70">✕</button>
            </div>

            {resetError && (
              <ErrorMessage message={resetError} />
            )}

            <form
              onSubmit={resetForm.handleSubmit((v) => resetPasswordMutation.mutate(v))}
              noValidate
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <p className="mb-1 text-xs text-muted-foreground">8–20 characters.</p>
                  <input
                    type="password"
                    {...resetForm.register('password')}
                    className={inputCls(!!resetForm.formState.errors.password)}
                  />
                  {resetForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    {...resetForm.register('confirmPassword')}
                    className={inputCls(!!resetForm.formState.errors.confirmPassword)}
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="rounded border px-4 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resetForm.formState.isValid || resetPasswordMutation.isPending}
                  className="rounded border border-green-600 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
