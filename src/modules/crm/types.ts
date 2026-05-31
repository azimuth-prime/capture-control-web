export interface OrgAddress {
  id?: string
  street?: string
  street2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
}

export interface OrgContact {
  id?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  title?: string
  isPrimary?: boolean
}

export interface Organization {
  id: string
  name: string
  organizationType: string
  status: string
  email?: string
  phone?: string
  website?: string
  billToAddress?: OrgAddress
  shipToAddress?: OrgAddress
  contacts?: OrgContact[]
  notes?: string
  currency?: string
  taxIsoCode?: string
  accountRep?: string
  creditLimit?: number
  paymentTerms?: string
  creationDate?: string
  lastModifiedDate?: string
}

export interface OrgSummary {
  id: string
  name: string
  organizationType: string
  status: string
  email?: string
  phone?: string
}

export interface OrgSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
  organizationType?: string
}

export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface Warehouse {
  id: string
  name: string
}

export interface Role {
  name: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  status: UserStatus
  roles: string[]
  warehouse?: Warehouse
  creationDate?: string
  lastModifiedDate?: string
  lastActivityDate?: string
}

export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  status: UserStatus
  roles: string[]
}

export interface UserSearchRequest {
  keyword: string
  page: number
  resultsPerPage: number
}

export interface ResetPasswordRequest {
  id: string
  password: string
}

export interface CustomerStats {
  totalOrders: number
  totalInvoices: number
  totalRevenue: number
  outstandingBalance: number
}
