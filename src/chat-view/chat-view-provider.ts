import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ask-ai-2.chatView';
  
  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
      // Set up the webview
      webviewView.webview.options = {
          enableScripts: true, // Enable JavaScript
          localResourceRoots: [this._extensionUri], // Allow loading local resources
      };

      // Set the HTML content for the webview
      webviewView.webview.html = this._getWebviewContent(webviewView.webview);

      // Handle messages from the webview
      webviewView.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'alert':
                vscode.window.showInformationMessage(message.text);
                break;
        }
    });
  }

  private _getWebviewContent(webview: vscode.Webview): string {
    // Get the local path to the script and convert it to a URI
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    // Use a nonce to only allow specific scripts to be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Custom View</title>
    </head>
    <body>
        <h1>Hello from My Custom View!</h1>
        <button id="alertButton">Show Alert</button>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
}
private getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
}


