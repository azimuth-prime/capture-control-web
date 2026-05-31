// ⚠️ TODO SECURITY: CLIENT_SECRET must move server-side before production.
// Replace TOKEN_URL with backend proxy (e.g. /api/auth/token) and remove CLIENT_SECRET.
// See .claude/team/architecture-decision.md §4 for full remediation plan.
const AUTH_CONFIG = {
  TOKEN_URL: '/capture/oauth/token',
  CLIENT_SECRET: btoa('web_client:!!ghftyx2t9'),
} as const

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

let _accessToken: string | null = null
let _refreshPromise: Promise<string> | null = null
const storage = window.localStorage

export function getAccessToken(): string | null {
  return _accessToken
}

export function isTokenExpired(): boolean {
  const expiresOn = storage.getItem('expires_on')
  return !expiresOn || new Date(expiresOn) < new Date()
}

export function isAuthenticated(): boolean {
  return storage.getItem('refresh_token') !== null
}

async function doRefresh(): Promise<string> {
  const refreshToken = storage.getItem('refresh_token')
  if (!refreshToken) {
    redirectToLogin()
    throw new Error('No refresh token')
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch(`${AUTH_CONFIG.TOKEN_URL}?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${AUTH_CONFIG.CLIENT_SECRET}`,
    },
  })

  if (!res.ok) {
    redirectToLogin()
    throw new Error('Token refresh failed')
  }

  const token: TokenResponse = await res.json()
  storage.setItem('refresh_token', token.refresh_token)
  storage.setItem('expires_on', new Date(Date.now() + token.expires_in * 1000).toISOString())
  _accessToken = token.access_token
  return token.access_token
}

export async function getValidToken(): Promise<string> {
  if (_accessToken && !isTokenExpired()) return _accessToken

  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => {
      _refreshPromise = null
    })
  }
  return _refreshPromise
}

export async function login(username: string, password: string): Promise<void> {
  const params = new URLSearchParams({ username, password, grant_type: 'password' })

  const res = await fetch(`${AUTH_CONFIG.TOKEN_URL}?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${AUTH_CONFIG.CLIENT_SECRET}`,
    },
  })

  if (!res.ok) throw new Error('Invalid credentials')

  const token: TokenResponse = await res.json()
  storage.setItem('refresh_token', token.refresh_token)
  storage.setItem('expires_on', new Date(Date.now() + token.expires_in * 1000).toISOString())
  _accessToken = token.access_token
}

export function logout(): void {
  _accessToken = null
  storage.removeItem('refresh_token')
  storage.removeItem('expires_on')
  redirectToLogin()
}

export function redirectToLogin(): void {
  window.location.href = '/login'
}
