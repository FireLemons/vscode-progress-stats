import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'
import * as vscode from 'vscode'

const execPromise = promisify(exec)

interface diffLineCounts {
  dailyCommittedLineCountNew: number
  dailyCommittedLineCountRemoved: number
}

export interface findStatsResult {
  errors?: Error[]
  stats: stats
}

export interface stats {
  dailyCommitCount: number
  dailyCommittedLineCountNew: number
  dailyCommittedLineCountRemoved: number
  uncommittedFiles: uncommittedFileStats[]
}

interface uncommittedFileStats {
  lineCountNew: number
  lineCountRemoved: number
  name: string
}

async function findDailyCommittedStats (workspacePath: string): Promise<stats> {
  const mostRecent2200AsISO = getMostRecentXHour(22).toISOString()
  let dailyCommittedLineCountsAsString

  try {
    dailyCommittedLineCountsAsString = (await execPromise(`git log --since ${mostRecent2200AsISO} --pretty=tformat: --shortstat`, {
      cwd: workspacePath
    })).stdout
  } catch (error) {
    if (error instanceof Error && /fatal: your current branch '.*' does not have any commits yet/.test(error.message)) {
      return {
        dailyCommitCount: 0,
        dailyCommittedLineCountRemoved: 0,
        dailyCommittedLineCountNew: 0,
        uncommittedFiles: []
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
    uncommittedFiles: []
  }
}

async function findUncommittedFileStats(workspacePath: string): Promise<uncommittedFileStats[]> {
  let uncommittedFileDataAsString

  const untrackedFileNamesAsSpaceSeparatedSequence = (await findUntrackedFileNames(workspacePath)).join(' ')

  let findUncommittedFileStatsCommand = 'git diff --staged --numstat'

  if (untrackedFileNamesAsSpaceSeparatedSequence.trim().length !== 0) {
    findUncommittedFileStatsCommand =
      'git add . && ' +
      findUncommittedFileStatsCommand + ' && ' +
      `git rm --cached ${untrackedFileNamesAsSpaceSeparatedSequence} > /dev/null`
  }

  uncommittedFileDataAsString = (await execPromise(
    findUncommittedFileStatsCommand, {
    cwd: workspacePath
  })).stdout

  return parseUncommittedFiles(uncommittedFileDataAsString)
}

async function findUntrackedFileNames (workspacePath: string): Promise<string[]> {
  let untrackedFileNamesAsString

  untrackedFileNamesAsString = (await execPromise('git ls-files --others --exclude-standard', {
    cwd: workspacePath
  })).stdout

  return untrackedFileNamesAsString.split('\n')
}

export default async function getGitStats (): Promise<findStatsResult> {
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
      errors,
      stats: {
        dailyCommitCount: -1,
        dailyCommittedLineCountDeleted: -1,
        dailyCommittedLineCountNew: -1,
        uncommittedFiles: []
      }
    }
  }

  let dailyCommitCount
  let dailyCommittedLineCountDeleted
  let dailyCommittedLineCountNew

  try {
    ({ dailyCommitCount, dailyCommittedLineCountDeleted, dailyCommittedLineCountNew } = await findDailyCommittedStats(workspacePath))
  } catch (error) {
    dailyCommitCount = -1
    dailyCommittedLineCountDeleted = -1
    dailyCommittedLineCountNew = -1
  }

  let uncommittedFiles: uncommittedFileStats[]

  try {
    uncommittedFiles = await findUncommittedFileStats(workspacePath)
  } catch (error) {
    appendToErrorsIfError(error)
    uncommittedFiles = []
  }

  const findStatsResult: findStatsResult = {
    errors,
    stats: {
      dailyCommitCount,
      dailyCommittedLineCountNew,
      dailyCommittedLineCountRemoved,
      uncommittedFiles
    }
  }

  return findStatsResult
}

function getMostRecentXHour (xHour: number): Date {
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

function parseDailyCommittedStats (outputLines: string[]): diffLineCounts {
  const diff = {
    dailyCommittedLineCountDeleted: 0,
    dailyCommittedLineCountNew: 0
  }

  if (outputLines.length === 0) {
    return diff
  }

  const dataCapturingPattern = /\d+ files changed, (?:(\d+) insertions\(\+\))?(?:, ?)?(?:(\d+) deletions\(-\))?/
  // X files changed, Y insertions(+), Z deletions(-)
  // X files changed, Y insertions(+)
  // X files changed, Z deletions(-)
  // Y is capture group 1 and Z is capture group 2

  for (const line of outputLines) {
    const captureResult = line.match(dataCapturingPattern)

    if (captureResult !== null) {
      diff.dailyCommittedLineCountDeleted += parseInt(captureResult[2]) || 0
      diff.dailyCommittedLineCountNew += parseInt(captureResult[1]) || 0
    }
  }

  return diff
}

function parseUncommittedFiles (fileDataAsString: string): uncommittedFileStats[] {
  const fileDataLines = fileDataAsString.split('\n')
  const statCapturingPattern = /^(\d+|-).*(\d+|-)(.*)/ // (new line count) (removed line count) (file name with path)
  const uncommittedFiles = []

  for (const line of fileDataLines) {
    const regexCaptures = statCapturingPattern.exec(line)

    if (regexCaptures !== null) {
      uncommittedFiles.push({
        lineCountNew: parseInt(regexCaptures[1]),
        lineCountRemoved: parseInt(regexCaptures[2]),
        name: regexCaptures[3].trim()
      })
    }
  }

  return uncommittedFiles
}