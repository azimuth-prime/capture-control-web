export interface AdminAddress {
  address1?: string
  address2?: string
  address3?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  phone?: string
  contactEmail?: string
}

export interface GlobalConfig {
  companyName?: string
  companyWebsite?: string
  address?: AdminAddress
  defaultCurrency?: string
  systemPrinter?: string
  measurementSystem?: 'METRIC' | 'STANDARD'
  productLabelPrinterURL?: string
  productLabelPrinterType?: string
  productLabelTemplate?: string
  qboEnabled?: boolean
  // Product settings
  singleVariation?: boolean
  // Purchase settings
  autoGenPOs?: boolean
  vendorSelection?: string
  autoSendPO?: boolean
  poRequireInvoice?: boolean
  landedCostExecution?: string
  landedCostCalculation?: string
  // Order settings
  backorder?: boolean
  splitShip?: boolean
  fulfillOnReceipt?: boolean
  allocationMethod?: string
  multiWarehouse?: boolean
  geoWarehouse?: boolean
  countryLimitedWarehouse?: boolean
  invoiceCreation?: string
  invoiceAutoSend?: boolean
  enableDropship?: boolean
  dropshipDirectShip?: boolean
  // EdgeHub settings
  customRFIDTag?: boolean
  rfidTagTemplate?: string
}

export interface Printer {
  name: string
}

export interface Currency {
  id?: string
  code: string
  name?: string
  symbol?: string
}

export interface PaymentConfigData {
  currencies: Currency[]
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface LoggingConfig {
  configuredLevel: LogLevel
  effectiveLevel: LogLevel
}

export type TaxType = 'PERCENT' | 'FLAT'
export type TaxAppliesTo = 'SUBTOTAL' | 'TOTAL'

export interface IntuitTax {
  id?: string
  name: string
}

export interface Tax {
  id?: string
  isoCode: string
  name: string
  taxName: string
  taxType: TaxType
  amount: number
  appliesTo: TaxAppliesTo
  orderOfOps?: number | null
  qbTax?: IntuitTax | null
}

export interface IntuitAccount {
  id?: string
  name: string
  accountType?: string
}

export interface IntuitItem {
  id?: string
  name: string
}

export interface QBInfo {
  accounts?: IntuitAccount[]
  items?: IntuitItem[]
  salesAccount?: string
  expenseAccount?: string
  assetAccount?: string
  shippingAccount?: string
  serviceAccount?: string
  salesItemType?: string
  shippingItemType?: string
  serviceItemType?: string
}

export interface AdminPasswordRequest {
  password: string
}

export interface ConfigParameterRequest {
  name: string
  value: string
}

export interface GLAccountRequest {
  name: string
  value: string
}

export type IndexJobState = 'PROCESSING' | 'COMPLETE' | 'ERROR' | 'CANCELLED'
export type IndexJobType = 'FULL' | 'INCREMENTAL'

export interface IndexJob {
  id: string | null
  state: IndexJobState
  jobType: IndexJobType
  startDate: string
  endDate?: string
  message?: string
  currentItem: number
  totalItems: number
  orgsIndexed: number
  totalOrgs: number
  usersIndexed: number
  totalUsers: number
  productsIndexed: number
  totalProducts: number
  skusIndexed: number
  totalSkus: number
  lotsIndexed: number
  totalLots: number
  serviceOrdersIndexed: number
  totalServiceOrders: number
  sosIndexed: number
  totalSos: number
  invoicesIndexed: number
  totalInvoices: number
  posIndexed: number
  totalPos: number
  restockIndexed: number
  totalRestock: number
}

export interface IndexJobWithElapsed extends IndexJob {
  elapsedTime: number
}

export interface IndexSearchRequest {
  page: number
  resultsPerPage: number
}

export interface CompanyInfoRequest {
  companyName: string
  companyWebsite?: string
  address: AdminAddress
}

export interface ProductLabelPrinterRequest {
  url: string
  type?: string
  labelTemplate?: string
}
