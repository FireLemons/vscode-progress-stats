import getClientPageSource from './clientLoader'
import { END_OF_DAY_HOUR, getNextEndOfDay } from './endOfDay'
import { existsSync as doesFileExist, mkdirSync, unlinkSync } from 'fs'
import getGitStats from './getGitStats'
import { createServer, Server } from 'net'
import { tmpdir as getTmpDir } from 'os'
import { join as joinPath } from 'path'
import { StatsSearchResult } from './shared'
import * as vscode from 'vscode'

const APP_SOCKET_DIRECTORY_PATH = joinPath(getTmpDir(), 'personal-progress-stats')

let currentStatsPanel: vscode.WebviewPanel | undefined
let endOfDayTimeout: NodeJS.Timeout | undefined
let socketServer: Server | undefined
let stagedStats: StatsSearchResult | undefined

function applyStatsPanelHooks (statsPanel: vscode.WebviewPanel, disposables: vscode.Disposable[]) {
  statsPanel.onDidChangeViewState((e) => {
    if (e.webviewPanel.visible) {
      if (stagedStats !== undefined) {
        e.webviewPanel.webview.postMessage(stagedStats)
      }

      stagedStats = undefined
    }
  })

  statsPanel.onDidDispose(
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
}

function ensureAppSocketDirectoryExists () {
  mkdirSync(APP_SOCKET_DIRECTORY_PATH, { recursive: true })
}

function getAppWebviewReinitializer (appContext: vscode.ExtensionContext, localTextAssetDir: vscode.Uri) {
  class AppWebviewReinitializer implements vscode.WebviewPanelSerializer {
    private appContext: vscode.ExtensionContext

    constructor (appContext: vscode.ExtensionContext) {
      this.appContext = appContext
    }

    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
      webviewPanel.webview.html = await getWebViewPage(localTextAssetDir, webviewPanel.webview)
      currentStatsPanel = webviewPanel

      applyStatsPanelHooks(webviewPanel, this.appContext.subscriptions)
      initStatsUpdateListeners(this.appContext)
    }
  }

  return new AppWebviewReinitializer(appContext)
}

function getNewWebSocketServer () {
  const SOCKET_PATH = joinPath(APP_SOCKET_DIRECTORY_PATH, 'update-ping.sock')

  if (doesFileExist(SOCKET_PATH)) {
    unlinkSync(SOCKET_PATH)
  }

  const server = createServer((socket) => {
    socket.on('data', () => {
      sendUpdatedStatsToDisplay()
      socket.end()
    })

    socket.on('error', (err) => {
      vscode.window.showInformationMessage(`Socket error: ${err.message}`)
    })
  })

  server.listen(SOCKET_PATH)
  server.on('error', (err) => {
      vscode.window.showInformationMessage(`Server error: ${err.message}`)
  })

  return server
}

async function getWebViewPage (localAssetDir: vscode.Uri, urlWrapper: vscode.Webview): Promise<string> {
  const statsSearchResult = await getGitStats()

  return getClientPageSource(localAssetDir, urlWrapper, statsSearchResult, END_OF_DAY_HOUR)
}

function getNewWebviewPanel (localAssetDir: vscode.Uri, disposables: vscode.Disposable[]):vscode.WebviewPanel {
  const newWebviewPanel = vscode.window.createWebviewPanel(
    'progress-stats', // webview type
    'Stats', // panel title
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [
        localAssetDir
      ]
    }
  )

  applyStatsPanelHooks(newWebviewPanel, disposables)

  return newWebviewPanel
}

function initStatsUpdateListeners (context: vscode.ExtensionContext) {
  ensureAppSocketDirectoryExists()

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument(() => {
    sendUpdatedStatsToDisplay()
  })

  socketServer = getNewWebSocketServer()
  initEndOfDayRefresh()

  context.subscriptions.push(postFileSaveListener)
}

function initEndOfDayRefresh ():void {
  const nextEndOfDay = getNextEndOfDay()

  if (endOfDayTimeout !== undefined) {
    return
  }

  endOfDayTimeout = setTimeout(() => {
    sendUpdatedStatsToDisplay()
    initEndOfDayRefresh()
  }, nextEndOfDay.valueOf() - (new Date()).valueOf() + 100)
}

function sendUpdatedStatsToDisplay ():void {
  getGitStats().then((stats) => {
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
  const localAssetDir = vscode.Uri.joinPath(context.extensionUri, 'media')

  const statsDisplay = vscode.commands.registerCommand('personal-progress-stats.start', async () => {
    const currentStatsPanelColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

    if (currentStatsPanel !== undefined) {
      currentStatsPanel.reveal(currentStatsPanelColumn)
    } else {
      currentStatsPanel = getNewWebviewPanel(localAssetDir, context.subscriptions)
    }

    currentStatsPanel.webview.html = await getWebViewPage(localAssetDir, currentStatsPanel.webview)
  })

  context.subscriptions.push(statsDisplay)

  initStatsUpdateListeners(context)

  vscode.window.registerWebviewPanelSerializer('progress-stats', getAppWebviewReinitializer(context, localAssetDir))
}
