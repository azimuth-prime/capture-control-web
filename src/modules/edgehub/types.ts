export type ScanJobStatus = 'INPROGRESS' | 'COMPLETE' | 'ERROR'

export interface EdgeHubWarehouse {
  id: string
  name: string
}

/** Full EdgeHub record returned by findById */
export interface EdgeHub {
  id: string
  name: string
  physicalWarehouse: EdgeHubWarehouse
  serialNumber?: string
  model?: string
  status?: string
}

/** Lightweight record returned by findAll */
export interface EdgeHubSummary {
  id: string
  name: string
  physicalWarehouse: EdgeHubWarehouse
  serialNumber?: string
  model?: string
  status?: string
}

export interface ScanJob {
  id: string
  status: ScanJobStatus
  startTime: string
  endTime?: string
  itemCount?: number
}

export interface EdgeHubTag {
  id: string
  epc: string
  creationDate: string
  lastModifiedDate: string
  lastFoundDate: string
  productName?: string
  lotSerial?: string
}

export interface EdgeHubStats {
  totalTags: number
  lastScanDate?: string
  [key: string]: unknown
}

export interface EdgeHubSaveRequest {
  id?: string
  name: string
  physicalWarehouse: { id: string }
}

export interface TagKeywordRequest {
  keyword: string
  page: number
  resultsPerPage: number
}
