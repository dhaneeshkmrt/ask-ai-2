import * as vscode from 'vscode';
import { ChatViewProvider } from './chat-view/chat-view-provider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "ask-ai-2" is now active!');

    // Register the Webview View Provider
    const provider = new ChatViewProvider(context.extensionUri);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider));

    // Register the command to open the sidebar
    const disposable = vscode.commands.registerCommand('ask-ai-2.openChat', () => {
        // Reveal the sidebar view
        vscode.commands.executeCommand('workbench.view.extension.ask-ai-2-sidebar');
    });

    context.subscriptions.push(disposable);
}


export function deactivate() {}