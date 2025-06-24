export interface DiffLineCounts {
  dailyCommittedLineCountRemoved: number
  dailyCommittedLineCountNew: number
}

export interface ErrorMessageAndStack {
  message: string
  stack: string
}

export interface Stats {
  dailyCommitCount: number
  dailyCommittedLineCountNew: number
  dailyCommittedLineCountRemoved: number
  uncommittedFiles: LineCountByFilePOJO
}

export interface StatsSearchResult {
  errors: ErrorMessageAndStack[]
  stats: Stats
}

export interface LineCountByFilePOJO {
  [key: string]: [number, number]
}

declare global {
  interface Window {
    __INITIAL_STATE__: StatsSearchResult
  }
}