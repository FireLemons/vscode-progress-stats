import { stats } from './getGitStats'
import * as vscode from 'vscode'

export default async function getClientPageSource (baseURI: vscode.Uri, stats: stats, errors?: Error[]): Promise<string> {
  const cssUri = vscode.Uri.joinPath(baseURI, 'assets', 'index.css')
  const jsUri = vscode.Uri.joinPath(baseURI, 'assets', 'index.js')
  const statsAsJSON = JSON.stringify(stats, null, 2)
  const errorsAsJSON = JSON.stringify(errors?.map((error) => {
    return {
      message: error.message,
      stack: error.stack
    }
  }), null, 2)

const html = `<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stats</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`

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