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

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument(() => {
    vscode.window.showInformationMessage(`currentStatsPanel !== undefined ${currentStatsPanel !== undefined}`)

    getGitStats().then((stats) => {
      if (currentStatsPanel !== undefined) {
        if (currentStatsPanel.visible) {
          currentStatsPanel.webview.postMessage(stats)
        } else {
          stagedStats = stats
        }
      }
    })
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

  context.subscriptions.push(postFileSaveListener)
  context.subscriptions.push(statsDisplay)
}
