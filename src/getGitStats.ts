import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'
import * as vscode from 'vscode'
import { DiffLineCounts, ErrorMessageAndStack, LineCountByFilePOJO, Stats, StatsSearchResult } from './shared'

type LineCountByFile = Map<string, [number, number]>

const execPromise = promisify(exec)

function errorsToPOJO (errors: Error[]): ErrorMessageAndStack[] {
  return errors.map((error) => {
    return {
      message: error.message,
      stack: error.stack ?? ''
    }
  })
}

async function findDailyCommittedStats (endOfDayHour: number, workspacePath: string): Promise<Stats> {
  const mostRecentEndOfDayAsISO = getMostRecentXHour(endOfDayHour).toISOString()
  let dailyCommittedLineCountsAsString

  try {
    dailyCommittedLineCountsAsString = (await execPromise(`git log --since ${mostRecentEndOfDayAsISO} --pretty=tformat: --shortstat`, {
      cwd: workspacePath
    })).stdout
  } catch (error) {
    if (error instanceof Error && /fatal: your current branch '.*' does not have any commits yet/.test(error.message)) {
      return {
        dailyCommitCount: 0,
        dailyCommittedLineCountRemoved: 0,
        dailyCommittedLineCountNew: 0,
        uncommittedFiles: {}
      }
    } else {
      throw error
    }
  }

  const dailyCommittedLineCountsAsStringByLine = dailyCommittedLineCountsAsString.split('\n')

  const { dailyCommittedLineCountRemoved, dailyCommittedLineCountNew } = parseDailyCommittedStats(dailyCommittedLineCountsAsStringByLine)

  return {
    dailyCommitCount: dailyCommittedLineCountsAsStringByLine.length - 1,
    dailyCommittedLineCountRemoved,
    dailyCommittedLineCountNew,
    uncommittedFiles: {}
  }
}

async function findUncommittedFileLineCounts (untrackedFilePathsSeparatedBySpaces: string, workspacePath: string): Promise<string> {
  const hasUntrackedFiles = untrackedFilePathsSeparatedBySpaces !== undefined && untrackedFilePathsSeparatedBySpaces.trim().length > 0
  const prepareStagedDiffCommand = hasUntrackedFiles ? `git add ${untrackedFilePathsSeparatedBySpaces} && ` : ''
  const tearDownStagedDiffCommand = hasUntrackedFiles ? `git rm --cached ${untrackedFilePathsSeparatedBySpaces} > /dev/null && ` : ''

  return (await execPromise(
    prepareStagedDiffCommand +
    'git diff --cached --numstat && ' +
    tearDownStagedDiffCommand +
    'git diff --numstat',
    {
      cwd: workspacePath
    }
  )).stdout
}

async function findUncommittedFileStats(workspacePath: string): Promise<LineCountByFilePOJO> {
  const untrackedFileNamesAsSpaceSeparatedSequence = (await findUntrackedFileNames(workspacePath)).join(' ')
  const uncommittedFileDataAsString = await findUncommittedFileLineCounts(untrackedFileNamesAsSpaceSeparatedSequence, workspacePath)

  return parseUncommittedFiles(uncommittedFileDataAsString)
}

async function findUntrackedFileNames (workspacePath: string): Promise<string[]> {
  let untrackedFileNamesAsString

  untrackedFileNamesAsString = (await execPromise('git ls-files --others --exclude-standard', {
    cwd: workspacePath
  })).stdout

  return untrackedFileNamesAsString.split('\n')
}

export default async function getGitStats (endOfDayHour: number): Promise<StatsSearchResult> {
  const errors: Error[] = []

  const appendToErrorsIfError = (obj: any) => {
    if (obj instanceof Error) {
      errors.push(obj)
    }
  }

  let workspacePath

  try {
    workspacePath = getWorkspacePath()
  } catch (error) {
    appendToErrorsIfError(error)

    return {
      errors: errorsToPOJO(errors),
      stats: {
        dailyCommitCount: -1,
        dailyCommittedLineCountRemoved: -1,
        dailyCommittedLineCountNew: -1,
        uncommittedFiles: {}
      }
    }
  }

  let dailyCommitCount
  let dailyCommittedLineCountRemoved
  let dailyCommittedLineCountNew

  try {
    ({ dailyCommitCount, dailyCommittedLineCountRemoved, dailyCommittedLineCountNew } = await findDailyCommittedStats(endOfDayHour, workspacePath))
  } catch (error) {
    appendToErrorsIfError(error)
    dailyCommitCount = -1
    dailyCommittedLineCountRemoved = -1
    dailyCommittedLineCountNew = -1
  }

  let uncommittedFiles: LineCountByFilePOJO

  try {
    uncommittedFiles = await findUncommittedFileStats(workspacePath)
  } catch (error) {
    appendToErrorsIfError(error)
    uncommittedFiles = {}
  }

  const findStatsResult: StatsSearchResult = {
    errors: errorsToPOJO(errors),
    stats: {
      dailyCommitCount,
      dailyCommittedLineCountNew,
      dailyCommittedLineCountRemoved,
      uncommittedFiles
    }
  }

  return findStatsResult
}

export function getMostRecentXHour (xHour: number): Date {
  if (xHour < 0) {
    throw new RangeError('param xHour must be 0 or higher')
  }

  if (xHour > 23) {
    throw new RangeError('param xHour must be 23 or less')
  }

  if (!(Number.isInteger(xHour))) {
    throw new RangeError('param xHour must be an integer')
  }

  const mostRecentXHour = new Date()
  mostRecentXHour.setMilliseconds(0)
  mostRecentXHour.setMinutes(0)
  mostRecentXHour.setSeconds(0)

  if (mostRecentXHour.getHours() < xHour) {
    mostRecentXHour.setDate(mostRecentXHour.getDate() - 1)
  }

  mostRecentXHour.setHours(xHour)
  return mostRecentXHour
}

function getWorkspacePath (): string {
  const workspaceFolders = vscode.workspace.workspaceFolders

  if (workspaceFolders === undefined || workspaceFolders.length === 0) {
    throw new ReferenceError('There are no workspace folders open in Visual Studio Code')
  }

  return path.normalize(workspaceFolders[0].uri.fsPath)
}

function parseDailyCommittedStats (commitDataAsLines: string[]): DiffLineCounts {
  const diff = {
    dailyCommittedLineCountRemoved: 0,
    dailyCommittedLineCountNew: 0
  }

  const dataCapturingPattern = /\d+ files? changed, (?:(\d+) insertions?\(\+\))?(?:, ?)?(?:(\d+) deletions?\(-\))?/
  // X files changed, Y insertions(+), Z deletions(-)
  // X files changed, Y insertions(+)
  // X files changed, Z deletions(-)
  // Y is capture group 1 and Z is capture group 2

  for (const line of commitDataAsLines) {
    const captureResult = line.match(dataCapturingPattern)

    if (captureResult !== null) {
      diff.dailyCommittedLineCountRemoved += parseInt(captureResult[2]) || 0
      diff.dailyCommittedLineCountNew += parseInt(captureResult[1]) || 0
    }
  }

  return diff
}

function parseUncommittedFiles (fileDataAsString: string): LineCountByFilePOJO {
  const fileDataLines = fileDataAsString.split('\n')
  const statCapturingPattern = /^(\d+|-).*(\d+|-)(.*)/ // (new line count) (removed line count) (file name with path)
  const uncommittedFiles: LineCountByFile = new Map()

  for (const line of fileDataLines) {
    const regexCaptures = statCapturingPattern.exec(line)

    if (regexCaptures !== null) {
      const filePath = regexCaptures[3].trim()
      const newLineCount = parseInt(regexCaptures[1])
      const removedLineCount = parseInt(regexCaptures[2])

      if (uncommittedFiles.has(filePath)) {
        const existingLineCount = uncommittedFiles.get(filePath)!

        existingLineCount[0] += newLineCount
        existingLineCount[1] += removedLineCount
      }

      uncommittedFiles.set(regexCaptures[3].trim(), [newLineCount, removedLineCount])
    }
  }

  return Object.fromEntries(uncommittedFiles)
}