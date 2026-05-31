import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService } from '../services/userService'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import type { Role, Warehouse } from '../types'
import type { ApiError } from '../../../shared/types'

const WAREHOUSE_ROLES = ['PICKER', 'PACKER', 'SHIPPER']
const EXEMPT_ROLES = ['ADMIN', 'WAREHOUSEMANAGER']

const userEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  roles: z.array(z.string()).default([]),
  warehouseId: z.string().optional(),
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

type UserEditValues = z.infer<typeof userEditSchema>
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function inputCls(hasError: boolean) {
  return `w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
    hasError ? 'border-destructive' : ''
  }`
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.findById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['users', 'roles'],
    queryFn: () => userService.findAllRoles().then((r) => r.data),
    staleTime: Infinity,
  })

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses', 'physical'],
    queryFn: () => userService.findAllWarehouses().then((r) => r.data),
    staleTime: Infinity,
  })

  function showToast(message: string, success: boolean) {
    setToast({ message, success })
    setTimeout(() => setToast(null), 4000)
  }

  const saveMutation = useMutation<void, { response?: { data?: ApiError } }, UserEditValues>({
    mutationFn: (data) => {
      const warehouse = warehouses?.find((w) => w.id === data.warehouseId)
      return userService
        .saveUser({
          ...user,
          firstName: data.firstName,
          lastName: data.lastName,
          status: data.status,
          roles: data.roles,
          warehouse,
        })
        .then(() => undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      showToast('User information saved.', true)
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
      userService.resetPassword({ id: id!, password: data.password }).then(() => undefined),
    onSuccess: () => {
      setResetModalOpen(false)
      resetForm.reset()
      showToast('Password has been reset.', true)
    },
    onError: (err) => setResetError(err.response?.data?.errorMessage ?? 'Reset failed.'),
  })

  const editForm = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    mode: 'onTouched',
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          roles: user.roles,
          warehouseId: user.warehouse?.id,
        }
      : undefined,
  })

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
  })

  const watchedRoles = editForm.watch('roles') ?? []
  const needsWarehouse =
    watchedRoles.some((r) => WAREHOUSE_ROLES.includes(r)) &&
    !watchedRoles.some((r) => EXEMPT_ROLES.includes(r))

  if (isLoading) return <LoadingSpinner message="Loading user..." />
  if (isError)
    return (
      <ErrorMessage
        title="Failed to load user"
        message={(error as Error).message}
        onRetry={refetch}
      />
    )
  if (!user) return null

  return (
    <div className="container-fluid px-4 py-2">
      <nav className="mb-4 text-sm text-muted-foreground">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:underline">Dashboard</Link></li>
          <li>/</li>
          <li><Link to="/access-management/users" className="hover:underline">Access Management</Link></li>
          <li>/</li>
          <li className="font-medium text-foreground">{user.firstName}</li>
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
        <form onSubmit={editForm.handleSubmit((v) => saveMutation.mutate(v))} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium">User Id</label>
              <p className="mb-1 text-xs text-muted-foreground">Auto-generated by the system.</p>
              <input disabled value={user.id} className="w-full rounded border bg-muted px-3 py-1.5 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">First Name <span className="text-destructive">*</span></label>
              <p className="mb-1 text-xs text-muted-foreground">User's first name.</p>
              <input type="text" {...editForm.register('firstName')} className={inputCls(!!editForm.formState.errors.firstName)} />
              {editForm.formState.errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{editForm.formState.errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Last Name <span className="text-destructive">*</span></label>
              <p className="mb-1 text-xs text-muted-foreground">User's last name.</p>
              <input type="text" {...editForm.register('lastName')} className={inputCls(!!editForm.formState.errors.lastName)} />
              {editForm.formState.errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{editForm.formState.errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <p className="mb-1 text-xs text-muted-foreground">Used for login. Cannot be changed here.</p>
              <input disabled value={user.email} className="w-full rounded border bg-muted px-3 py-1.5 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Creation Date</label>
              <p className="mb-1 text-xs text-muted-foreground">Date the account was created.</p>
              <input disabled value={user.creationDate?.substring(0, 10) ?? ''} className="w-full rounded border bg-muted px-3 py-1.5 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Last Modified Date</label>
              <p className="mb-1 text-xs text-muted-foreground">Date of last account update.</p>
              <input disabled value={user.lastModifiedDate?.substring(0, 10) ?? ''} className="w-full rounded border bg-muted px-3 py-1.5 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Last Activity Date</label>
              <p className="mb-1 text-xs text-muted-foreground">Date of user's last activity.</p>
              <input disabled value={user.lastActivityDate?.substring(0, 10) ?? ''} className="w-full rounded border bg-muted px-3 py-1.5 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <p className="mb-1 text-xs text-muted-foreground">Disabled users cannot log in.</p>
              <div className="flex gap-4">
                {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value={s} {...editForm.register('status')} className="accent-primary" />
                    {s === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Roles</label>
              <p className="mb-1 text-xs text-muted-foreground">
                Admin role grants access to all functionality.
              </p>
              <select
                multiple
                size={10}
                {...editForm.register('roles')}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                {roles?.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {needsWarehouse && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Physical Warehouse <span className="text-destructive">*</span>
                </label>
                <p className="mb-1 text-xs text-muted-foreground">
                  Pickers, Packers, and Shippers must be assigned a physical warehouse.
                </p>
                <select {...editForm.register('warehouseId')} className="w-full rounded border px-3 py-1.5 text-sm">
                  <option value="">Select Warehouse</option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
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
              disabled={!editForm.formState.isValid || saveMutation.isPending}
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
                <button type="button" onClick={() => setResetModalOpen(false)} className="rounded border px-4 py-1.5 text-sm text-destructive hover:bg-destructive/10">Cancel</button>
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
