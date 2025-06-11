export interface diffLineCounts {
  dailyCommittedLineCountDeleted: number
  dailyCommittedLineCountNew: number
}

export interface errorMessageAndStack {
  message: string
  stack: string
}

export interface stats {
  dailyCommitCount: number
  dailyCommittedLineCountNew: number
  dailyCommittedLineCountRemoved: number
  uncommittedFiles: uncommittedFileStats[]
}

export interface statsSearchResult {
  errors: errorMessageAndStack[]
  stats: stats
}

export interface uncommittedFileStats {
  lineCountNew: number
  lineCountRemoved: number
  name: string
}

declare global {
  interface Window {
    __INITIAL_STATE__: statsSearchResult
  }
}