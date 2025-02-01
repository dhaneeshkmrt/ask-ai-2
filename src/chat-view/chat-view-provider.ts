import * as vscode from 'vscode';
import * as marked from 'marked';
import { AiResponse } from '../models/ai-response.model';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ask-ai-2.chatView';

    constructor(private readonly _extensionUri: vscode.Uri) { }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        // Set up the webview
        webviewView.webview.options = {
            enableScripts: true, // Enable JavaScript
            localResourceRoots: [this._extensionUri], // Allow loading local resources
        };

        // Set the HTML content for the webview
        webviewView.webview.html = this._getWebviewContent(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'addMessage':
                    this.addMessageToWebview(webviewView.webview, message.text, message.sender);
                    if (message.sender === 'user') {
                        this.showLoader(webviewView.webview);
                        const response = await this.sendMessageToOllamaAPI(message.text);
                        this.hideLoader(webviewView.webview);
                        this.addMessageToWebview(webviewView.webview, response, 'bot');
                    }
                    break;
            }
        });

        // Send initial chat data to the webview
        webviewView.webview.postMessage({
            command: 'initialize',
            messages: [
                { sender: 'user', text: 'Hi, I need help with my recent order #123456789' },
                { sender: 'bot', text: 'Your order\'s on its way!' },
                { sender: 'user', text: 'When will it arrive?' },
                { sender: 'bot', text: 'Expect it by February 15th and keep an eye on it via XYZ123456789' },
                { sender: 'user', text: 'Thanks a lot!' }
            ]
        });
    }

    private getSelectedCode() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            return selectedText;
        }
        return '';
    }

    private async sendMessageToOllamaAPI(userMessage: string): Promise<string> {
        const selectedCode = this.getSelectedCode();

        const systemPrompt = `You are an expert programming assistant. Format your responses using these rules:
            1. Use markdown formatting with proper code blocks
            2. Separate explanations and code with clear headings using markdown (##)
            3. Keep explanations concise and focused
            4. Structure complex responses in sections
            `;

        const prompt = `
            ${selectedCode ? `**Context (Selected Code):** \`\`\` ${selectedCode} \`\`\`\n` : ''}
            **User Query:** ${userMessage}
            **Task:** Provide a clear, well-structured response that directly addresses the query. Include relevant code examples where appropriate.
        `;
        const s =``;

        const response = await this.getResponseText(prompt);
        return response;
    }

    private async getResponseText(prompt: string): Promise<string> {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-coder:1.3b',
                prompt: prompt,
                stream: false,
            })
        });

        const data = await response.json() as AiResponse;
        console.log('ask ai raw response: ', data.response);
        console.log('===================');
        const htmlContent = marked.parse(data.response);
        console.log('ask ai formatted Response', htmlContent);
        return htmlContent;
    }



    private addMessageToWebview(webview: vscode.Webview, text: string, sender: string) {
        webview.postMessage({
            command: 'addMessage',
            text: text,
            sender: sender
        });
    }

    private showLoader(webview: vscode.Webview) {
        webview.postMessage({
            command: 'showLoader'
        });
    }

    private hideLoader(webview: vscode.Webview) {
        webview.postMessage({
            command: 'hideLoader'
        });
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        // Get the local path to the script and convert it to a URI
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // Use a nonce to only allow specific scripts to be run
        const nonce = this.getNonce();

        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Interface</title>
    </head>
    <body>
        <div class="chat-container">
            <div class="chat-header">
                Chatbot
            </div>
            <div class="chat-messages" id="chat-messages">
                <!-- Messages will be dynamically added here -->
            </div>
            <div id="loader" class="loader" style="display: none;">Loading...</div>
            <form>
            <div class="chat-input">
                <input id="chat-input" type="text" placeholder="Type here..." value="Refactor the code to make it more readable.">
                <button type="submit" id="send-button">Send</button>
            </div>
            </form>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'initialize':
                        const messages = message.messages;
                        messages.forEach(msg => addMessage(msg.text, msg.sender));
                        break;
                    case 'addMessage':
                        addMessage(message.text, message.sender);
                        break;
                    case 'showLoader':
                        document.getElementById('loader').style.display = 'block';
                        break;
                    case 'hideLoader':
                        document.getElementById('loader').style.display = 'none';
                        break;
                }
            });

            document.getElementById('send-button').addEventListener('click', (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-input');
                const text = input.value;
                if (text) {
                    vscode.postMessage({ command: 'addMessage', text: text, sender: 'user' });
                    input.value = '';
                }
            });

            function addMessage(text, sender) {
                const chatMessages = document.getElementById('chat-messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + sender;
                const messageText = document.createElement('div');
                messageText.className = 'div-message';
                messageText.innerHTML = text;
                messageDiv.appendChild(messageText);
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        </script>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #121212;
                margin: 0;
                padding: 0;
                height: 100vh;
                display: flex;
                flex-direction: column;
                color: #e0e0e0;
            }

            .chat-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                background-color: #1e1e1e;
                width: 100%;
                max-width: 100%;
                height: 100%;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }

            .chat-header {
                background-color: #0d47a1;
                color: #ffffff;
                padding: 15px;
                font-size: 18px;
                text-align: center;
            }

            .chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                border-bottom: 1px solid #333;
            }

            .message {
                margin-bottom: 15px;
            }

            .message.user {
                text-align: right;
            }

            .message.bot {
                text-align: left;
            }

            .message .div-message {
                display: inline-block;
                padding: 10px;
                border-radius: 10px;
                max-width: 70%;
            }

            .message.user .div-message {
                background-color: #0d47a1;
                color: #ffffff;
            }

            .message.bot .div-message {
                background-color: #333;
                color: #e0e0e0;
            }

            .chat-input {
                display: flex;
                border-top: 1px solid #333;
                padding: 10px;
                background-color: #1e1e1e;
            }

            .chat-input input {
                flex: 1;
                padding: 10px;
                border: 1px solid #333;
                border-radius: 5px;
                outline: none;
                background-color: #2c2c2c;
                color: #e0e0e0;
            }

            .chat-input button {
                padding: 10px 15px;
                background-color: #0d47a1;
                color: #ffffff;
                border: none;
                border-radius: 5px;
                margin-left: 10px;
                cursor: pointer;
            }

            .chat-input button:hover {
                background-color: #1565c0;
            }

            .loader {
                text-align: center;
                padding: 10px;
                color: #ffffff;
            }
        </style>
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


