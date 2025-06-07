import * as vscode from 'vscode'
import getGitStats, { findStatsResult } from './getGitStats'
import getClientPageSource from './clientLoader'

async function getWebViewPage (localAssetsRootURI: vscode.Uri): Promise<string> {
  let stats
  let errors

  ({ errors, stats } = await getGitStats())

  return getClientPageSource(localAssetsRootURI, stats, errors)
}

export function activate(context: vscode.ExtensionContext) {
  const { extensionUri } = context
  let currentStatsPanel: vscode.WebviewPanel | undefined = undefined

  const postFileSaveListener = vscode.workspace.onDidSaveTextDocument((document) => {
    vscode.window.showInformationMessage(`Saved: ${document.uri.fsPath}`)
  })

  const statsWindow = vscode.commands.registerCommand('personal-progress-stats.start', async () => {
    const currentStatsPanelColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined

    if (currentStatsPanel !== undefined) {
      currentStatsPanel.reveal(currentStatsPanelColumn);
    } else {
      currentStatsPanel = vscode.window.createWebviewPanel(
        'progress-stats', // webview type
        'Stats', // panel title
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'extension-webview-client', 'dist'),
          ]
        }
      )

      currentStatsPanel.onDidDispose(
        () => {
          currentStatsPanel = undefined
        },
        null,
        context.subscriptions
      )
    }

    currentStatsPanel.webview.html = await getWebViewPage(extensionUri)
  })

  context.subscriptions.push(postFileSaveListener)
  context.subscriptions.push(statsWindow)
}
