import getClientPageSource from './clientLoader'
import { existsSync as doesFileExist, mkdirSync, unlinkSync } from 'fs'
import getGitStats, { getMostRecentXHour } from './getGitStats'
import { createServer, Server } from 'net'
import { tmpdir as getTmpDir } from 'os'
import { join as joinPath } from 'path'
import { StatsSearchResult } from './shared'
import * as vscode from 'vscode'

let currentStatsPanel: vscode.WebviewPanel | undefined
let endOfDayTimeout: NodeJS.Timeout | undefined
let socketServer: Server | undefined
let stagedStats: StatsSearchResult | undefined

const APP_SOCKET_DIRECTORY_PATH = joinPath(getTmpDir(), 'personal-progress-stats')
const END_OF_DAY_HOUR = 22

function ensureAppSocketDirectoryExists () {
  mkdirSync(APP_SOCKET_DIRECTORY_PATH, { recursive: true })
}

function getNewWebSocketServer () {
  const SOCKET_PATH = joinPath(APP_SOCKET_DIRECTORY_PATH, 'update-ping.sock')

  if (doesFileExist(SOCKET_PATH)) {
    unlinkSync(SOCKET_PATH)
  }

  const server = createServer((socket) => {
    socket.on('data', (data) => {
      vscode.window.showInformationMessage('Received from client:', data.toString())
      sendUpdatedStatsToDisplay()
    })

    socket.on('error', (err) => {
      vscode.window.showInformationMessage('Socket error:', err.message)
    })
  })

  server.listen(SOCKET_PATH, () => {
    vscode.window.showInformationMessage(`Server listening on ${SOCKET_PATH}`)
  })

  server.on('error', (err) => {
      vscode.window.showInformationMessage('Server error:', err.message)
  })

  return server
}

async function getWebViewPage (localTextAssetDir: vscode.Uri, urlWrapper: vscode.Webview): Promise<string> {
  let stats
  let errors

  ({ errors, stats } = await getGitStats(END_OF_DAY_HOUR))

  return getClientPageSource(localTextAssetDir, urlWrapper, stats, errors)
}

function getNewWebviewPanel (localTextAssetDir: vscode.Uri, disposables: vscode.Disposable[]):vscode.WebviewPanel {
  const newWebviewPanel = vscode.window.createWebviewPanel(
    'progress-stats', // webview type
    'Stats', // panel title
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        localTextAssetDir,
      ]
    }
  )

  newWebviewPanel.onDidChangeViewState((e) => {
    if (e.webviewPanel.visible) {
      if (stagedStats !== undefined) {
        e.webviewPanel.webview.postMessage(stagedStats)
      }

      stagedStats = undefined
    }
  })

  newWebviewPanel.onDidDispose(
    () => {
      clearTimeout(endOfDayTimeout)
      socketServer?.close()

      currentStatsPanel = undefined
      endOfDayTimeout = undefined
      socketServer = undefined
      stagedStats = undefined
    },
    null,
    disposables
  )

  return newWebviewPanel
}

function initEndOfDayRefresh ():void {
  const nextEndOfDay = getMostRecentXHour(END_OF_DAY_HOUR)
  nextEndOfDay.setDate(nextEndOfDay.getDate() + 1)

  if (endOfDayTimeout !== undefined) {
    return
  }

  endOfDayTimeout = setTimeout(() => {
    sendUpdatedStatsToDisplay()
    initEndOfDayRefresh()
  }, nextEndOfDay.valueOf() - (new Date()).valueOf() + 100)
}

function sendUpdatedStatsToDisplay ():void {
  getGitStats(END_OF_DAY_HOUR).then((stats) => {
    if (currentStatsPanel !== undefined) {
      if (currentStatsPanel.visible) {
        currentStatsPanel.webview.postMessage(stats)
      } else {
        stagedStats = stats
      }
    }
  })
}

export function activate(context: vscode.ExtensionContext) {
  const localTextAssetDir = vscode.Uri.joinPath(context.extensionUri, 'media')

  ensureAppSocketDirectoryExists()

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument(() => {
    sendUpdatedStatsToDisplay()
  }) 

  const statsDisplay = vscode.commands.registerCommand('personal-progress-stats.start', async () => {
    const currentStatsPanelColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

    if (currentStatsPanel !== undefined) {
      currentStatsPanel.reveal(currentStatsPanelColumn)
    } else {
      currentStatsPanel = getNewWebviewPanel(localTextAssetDir, context.subscriptions)
    }

    socketServer = getNewWebSocketServer()
    initEndOfDayRefresh()

    currentStatsPanel.webview.html = await getWebViewPage(localTextAssetDir, currentStatsPanel.webview)
  })

  const statsUpdate = vscode.commands.registerCommand('personal-progress-stats.update', () => {
    sendUpdatedStatsToDisplay()
  })

  context.subscriptions.push(postFileSaveListener)
  context.subscriptions.push(statsDisplay)
  context.subscriptions.push(statsUpdate)
}
