import crypto from "node:crypto"
import { errorMessageAndStack, stats } from './shared'
import * as vscode from 'vscode'

function getNonce(): string {
  return crypto.randomBytes(16).toString("base64")
}

export default async function getClientPageSource (localTextAssetDir: vscode.Uri, urlWrapper: vscode.Webview, stats: stats, errors: errorMessageAndStack[] = []): Promise<string> {
  const cssLocalFilePath = urlWrapper.asWebviewUri(vscode.Uri.joinPath(localTextAssetDir, 'index.css'))
  const jsLocalFilePath = urlWrapper.asWebviewUri(vscode.Uri.joinPath(localTextAssetDir, 'index.js'))
  const statsAsJSON = JSON.stringify(stats, null, 2)
  const errorsAsJSON = JSON.stringify(errors?.map((error) => {
    return {
      message: error.message,
      stack: error.stack
    }
  }))

return `<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${cssLocalFilePath}">
    <script>
      window.__INITIAL_STATE__ = {
        errors: ${errorsAsJSON},
        stats: ${statsAsJSON}
      }
    </script>
    <title>Stats</title>
  </head>
  <body>
    <div id="app">
      <p>${cssLocalFilePath}</p>
      <p>${jsLocalFilePath}</p>
      <script type="module" nonce=${getNonce()} src="${jsLocalFilePath}"></script>
    </div>
  </body>
</html>`
}