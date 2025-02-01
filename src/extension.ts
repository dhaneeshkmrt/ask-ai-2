// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "ask-ai-2" is now active!');

	// Register the command to open the webview panel
	const disposable = vscode.commands.registerCommand('ask-ai-2.openChat', () => {
		// Create and show the webview panel
		vscode.window.showInformationMessage('Hello World from ask-ai-2!');
			
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
