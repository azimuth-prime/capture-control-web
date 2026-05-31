import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getValidToken } from './authService'
import { LoadingSpinner } from '../shared/components/LoadingSpinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    getValidToken()
      .then(() => setIsAuthed(true))
      .catch(() => setIsAuthed(false))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (!isAuthed) return <Navigate to="/login" replace />
  return <>{children}</>
}
