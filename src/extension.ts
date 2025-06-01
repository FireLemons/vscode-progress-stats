import * as vscode from 'vscode'
import getGitStats from './getGitStats'

async function getInitialWebViewContent (): Promise<string> {
  let stats
  let errors

  try {
    ({ errors, stats } = await getGitStats())
  } catch (error) {
    stats = undefined
  }

  const statsAsJSON = JSON.stringify(stats, null, 2)
  const errorsAsJSON = JSON.stringify(errors?.map((error) => {
    return {
      message: error.message,
      stack: error.stack
    }
  }), null, 2)

  return `
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
    </script>
    <title>Stats</title>
  </head>
  <body>
    <div id="app">
      <textarea>
${statsAsJSON}
      </textarea>
      <textarea>
${errorsAsJSON}
      </textarea>
    </div>
  </body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
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
        {}
      )

      currentStatsPanel.onDidDispose(
        () => {
          currentStatsPanel = undefined
        },
        null,
        context.subscriptions
      )
    }

    currentStatsPanel.webview.html = await getInitialWebViewContent()
  })

  context.subscriptions.push(postFileSaveListener)
  context.subscriptions.push(statsWindow)
}
