import * as vscode from 'vscode'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

interface stats {
  dailyCommits: number
  dailyCommittedLineCountDeleted: number
  dailyCommittedLineCountNew: number
  uncommittedFiles: {
    name: string
    lineCountDeleted: number
    lineCountNew: number
  }[]
}

async function getGitStats () {
  const { stdout, stderr } = await execPromise('git diff --shortstat')

  return stdout
}

function getInitialWebViewContent (): string {
  return `
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
    vscode.commands.registerCommand('personal-progress-stats.start', () => {
      const panel = vscode.window.createWebviewPanel(
        'progress-stats', // Identifies the type of the webview. Used internally
        'Stats', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      )

      panel.webview.html = getInitialWebViewContent()
    })
  )
}
