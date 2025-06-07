import * as vscode from 'vscode'
import getGitStats from './getGitStats'
import getClientPageSource from './clientLoader'

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

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument((document) => {
    vscode.window.showInformationMessage(`Saved: ${document.uri.fsPath}`)
  })

  const statsDisplay = vscode.commands.registerCommand('personal-progress-stats.start', async () => {
    const currentStatsPanelColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

    if (currentStatsPanel !== undefined) {
      currentStatsPanel.reveal(currentStatsPanelColumn);
    } else {
      currentStatsPanel = getNewWebviewPanel(localTextAssetDir)

      currentStatsPanel.onDidDispose(
        () => {
          currentStatsPanel = undefined
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
