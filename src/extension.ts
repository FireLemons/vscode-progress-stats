import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
    vscode.commands.registerCommand('personal-progress-stats.start', () => {
      const panel = vscode.window.createWebviewPanel(
        'progress-stats', // Identifies the type of the webview. Used internally
        'Stats', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
      )
    })
  )
}
