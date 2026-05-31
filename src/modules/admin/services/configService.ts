import axiosInstance from '../../../auth/axiosInstance'
import type {
  AdminPasswordRequest,
  CompanyInfoRequest,
  ConfigParameterRequest,
  Currency,
  GLAccountRequest,
  GlobalConfig,
  LoggingConfig,
  PaymentConfigData,
  Printer,
  ProductLabelPrinterRequest,
  QBInfo,
  Tax,
  IntuitTax,
} from '../types'

export const configService = {
  findPaymentConfigData: () =>
    axiosInstance.get<PaymentConfigData>('/capture/payment/config'),

  findCurrencyById: (id: string) =>
    axiosInstance.get<Currency>(`/capture/payment/currency/${id}`),

  deleteCurrencyById: (id: string) =>
    axiosInstance.delete<void>(`/capture/payment/currency/${id}`),

  saveCurrency: (data: Currency) =>
    axiosInstance.post<Currency>('/capture/payment/currency', data),

  findGlobalConfig: () =>
    axiosInstance.get<GlobalConfig>('/capture/config/global'),

  saveGlobalConfig: (data: GlobalConfig) =>
    axiosInstance.post<GlobalConfig>('/capture/config/global', data),

  setParameter: (data: ConfigParameterRequest) =>
    axiosInstance.post<GlobalConfig>('/capture/config/global/parameter', data),

  saveCompanyInfo: (data: CompanyInfoRequest) =>
    axiosInstance.post<GlobalConfig>('/capture/config/global/companyinfo', data),

  findAllPrinters: () =>
    axiosInstance.get<Printer[]>('/capture/config/global/printers'),

  saveProductLabelPrinterInfo: (data: ProductLabelPrinterRequest) =>
    axiosInstance.post<GlobalConfig>('/capture/config/global/printers', data),

  getIntuitData: () =>
    axiosInstance.get<QBInfo>('/capture/integration/intuit/config'),

  removeIntuitAccount: () =>
    axiosInstance.delete<void>('/capture/integration/intuit/remove'),

  setGLAccount: (data: GLAccountRequest) =>
    axiosInstance.post<void>('/capture/integration/intuit/account', data),

  setProductType: (data: GLAccountRequest) =>
    axiosInstance.post<void>('/capture/integration/intuit/item', data),

  getLoggingLevel: () =>
    axiosInstance.get<LoggingConfig>('/capture/actuator/loggers/com.capture'),

  setLoggingLevel: (data: Pick<LoggingConfig, 'configuredLevel'>) =>
    axiosInstance.post<void>('/capture/actuator/loggers/com.capture', data),

  getLog: () =>
    axiosInstance.get<string>('/capture/config/global/logging/getLog'),

  resetAdminPassword: (data: AdminPasswordRequest) =>
    axiosInstance.post<void>('/capture/config/global/admin/password', data),

  getAllTaxes: () =>
    axiosInstance.get<Tax[]>('/capture/tax'),

  getTaxById: (id: string) =>
    axiosInstance.get<Tax>(`/capture/tax/${id}`),

  saveTax: (data: Tax) =>
    axiosInstance.post<Tax>('/capture/tax', data),

  getAllIntuitTaxes: () =>
    axiosInstance.get<IntuitTax[]>('/capture/tax/intuit'),
}
