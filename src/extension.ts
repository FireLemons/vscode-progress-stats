import * as vscode from 'vscode'
import getGitStats from './getGitStats'
import getClientPageSource from './clientLoader'
import { statsSearchResult } from './shared'

async function getWebViewPage (localTextAssetDir: vscode.Uri, urlWrapper: vscode.Webview): Promise<string> {
  let stats
  let errors

  ({ errors, stats } = await getGitStats())

  return getClientPageSource(localTextAssetDir, urlWrapper, stats, errors)
}

function getNewWebviewPanel (localTextAssetDir: vscode.Uri) {
  return vscode.window.createWebviewPanel(
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
}

export function activate(context: vscode.ExtensionContext) {
  const localTextAssetDir = vscode.Uri.joinPath(context.extensionUri, 'src', 'extension-webview-client', 'dist', 'assets')
  let currentStatsPanel: vscode.WebviewPanel | undefined
  let stagedStats: statsSearchResult | undefined

  const updateStats = () => {
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

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument(() => {
    updateStats()
  })

  const statsDisplay = vscode.commands.registerCommand('personal-progress-stats.start', async () => {
    const currentStatsPanelColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

    if (currentStatsPanel !== undefined) {
      currentStatsPanel.reveal(currentStatsPanelColumn);
    } else {
      currentStatsPanel = getNewWebviewPanel(localTextAssetDir)

      currentStatsPanel.onDidChangeViewState(e => {
        if (e.webviewPanel.visible) {
          if (stagedStats !== undefined) {
            e.webviewPanel.webview.postMessage(stagedStats)
          }

          stagedStats = undefined
        }
      })

      currentStatsPanel.onDidDispose(
        () => {
          currentStatsPanel = undefined
          stagedStats = undefined
        },
        null,
        context.subscriptions
      )
    }

    currentStatsPanel.webview.html = await getWebViewPage(localTextAssetDir, currentStatsPanel.webview)
  })

  const statsUpdate = vscode.commands.registerCommand('personal-progress-stats.update', () => {
    vscode.window.showInformationMessage('Hello from your extension!');
    updateStats()
  })

  context.subscriptions.push(postFileSaveListener)
  context.subscriptions.push(statsDisplay)
  context.subscriptions.push(statsUpdate)
}
