import { testHour } from "./endOfDay"
import { readdir } from 'fs/promises'
import { randomBytes } from "node:crypto"
import { ErrorMessageAndStack, StatsSearchResult } from './shared'
import * as vscode from 'vscode'

function formatErrorsAsPOJO (errors: ErrorMessageAndStack[]) {
  return errors.map((error) => {
    return {
      message: error.message,
      stack: error.stack
    }
  })
}

function getNonce(): string {
  return randomBytes(16).toString("base64")
}

export default async function getClientPageSource (localAssetDir: vscode.Uri, urlWrapper: vscode.Webview, statsSearchResult: StatsSearchResult, endOfDayHour: number): Promise<string> {
  testHour(endOfDayHour)

  let backgroundImageAssetURIs: string | undefined
  const cssURI = urlWrapper.asWebviewUri(vscode.Uri.joinPath(localAssetDir, 'index.css'))
  const jsURI = urlWrapper.asWebviewUri(vscode.Uri.joinPath(localAssetDir, 'index.js'))
  const { errors, stats } = statsSearchResult
  const statsAsJSON = JSON.stringify(stats, null, 2)
  const errorsAsJSON = JSON.stringify(formatErrorsAsPOJO(errors))

  try {
    backgroundImageAssetURIs = await getCSSAccessibleURIsForAssetDirAsInternalStyleSheet(vscode.Uri.joinPath(localAssetDir, 'img'), 'bg-img', urlWrapper)
  } catch (error) {
    if (error instanceof Error) {
      errors.push({
        message: error.message,
        stack: error.stack ?? ''
      })
    } else {
      errors.push({
        message: '',
        stack: ''
      })
    }
  }

return `<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${backgroundImageAssetURIs}
    <link rel="stylesheet" href="${cssURI}">
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
      <p>${cssURI}</p>
      <p>${jsURI}</p>
      <script type="module" nonce=${getNonce()} src="${jsURI}"></script>
    </div>
  </body>
</html>`
}

async function listAssetURIs (assetDir: vscode.Uri, URIWrapper: vscode.Webview): Promise<vscode.Uri[]> {
  const localAssetPaths = await readdir(assetDir.fsPath)

  return localAssetPaths.map((path) => {
    return URIWrapper.asWebviewUri(vscode.Uri.file(path))
  })
}

async function getCSSAccessibleURIsForAssetDirAsInternalStyleSheet (assetDir: vscode.Uri, assetTypeName: string, URIWrapper: vscode.Webview): Promise<string> {
  const assetURIs = await listAssetURIs(assetDir, URIWrapper)

  let cssVariables = ''

  for (let i = 0; i < assetURIs.length; i++) {
    const assetURI = assetURIs[i]
    cssVariables += `     ${assetTypeName}-url-${i}: url("${assetURI}");`
  }

  return `<style>
  :root {
${cssVariables}
  }
</style>
`
}