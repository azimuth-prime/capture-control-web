export interface Address {
  id?: string
  companyName?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  street1: string
  street2?: string
  city: string
  province: string
  postalCode: string
  country: string
}

export interface PagedResult<T> {
  results: T[]
  page: number
  pages: number
  totalResults: number
  hasNext: boolean
  hasPrevious: boolean
  keyword?: string
  sortDirection?: '+' | '-'
}

export interface ApiError {
  errorMessage: string
  errorCode?: string
}
