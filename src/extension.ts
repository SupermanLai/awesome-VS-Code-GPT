import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating ChatGPT extension...');
  let panel: vscode.WebviewPanel | undefined = undefined;

  let disposable = vscode.commands.registerCommand('chatgpt-vscode.start', async () => {
    console.log('ChatGPT command started...');
    if (!panel) {
      console.log('Creating new webview panel...');
      panel = vscode.window.createWebviewPanel(
        'chatgpt',
        'ChatGPT',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.onDidDispose(() => {
        console.log('ChatGPT panel disposed...');
        panel = undefined;
      });

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message) => {
          console.log('Received message from webview:', message);
          switch (message.command) {
            case 'sendMessage':
              console.log('Sending message to ChatGPT:', message.text);
              const response = await sendChatGPTMessage(message.text);
              console.log('Received response from ChatGPT:', response);
              panel!.webview.postMessage({ command: 'receiveMessage', text: response });
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  });

  context.subscriptions.push(disposable);
  console.log('ChatGPT extension activated...');
}

export function deactivate() {
  console.log('Deactivating ChatGPT extension...');
}

function getWebviewContent() {
  console.log('Generating webview content...');
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ChatGPT</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          height: 100vh;
          margin: 0;
        }
        #message-container {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          border-bottom: 1px solid #ccc;
        }
        #input-container {
          display: flex;
          padding: 10px;
        }
        #input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-right: 10px;
        }
        #send {
          padding: 10px 20px;
          border: none;
          background-color: #007ACC;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        #send:hover {
          background-color: #005A9E;
        }
      </style>
    </head>
    <body>
      <div id="message-container"></div>
      <div id="input-container">
        <input id="input" type="text" placeholder="Type a message..." />
        <button id="send">Send</button>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const messageContainer = document.getElementById('message-container');
        const input = document.getElementById('input');
        const sendButton = document.getElementById('send');

        console.log('Webview script loaded');

        sendButton.addEventListener('click', () => {
          const text = input.value;
          if (text) {
            console.log('Sending message:', text);
            addMessage('You', text);
            vscode.postMessage({ command: 'sendMessage', text });
            input.value = '';
          }
        });

        window.addEventListener('message', event => {
          const message = event.data;
          console.log('Received message from extension:', message);
          switch (message.command) {
            case 'receiveMessage':
              addMessage('ChatGPT', message.text);
              break;
          }
        });

        function addMessage(sender, text) {
          const messageDiv = document.createElement('div');
          messageDiv.textContent = \`\${sender}: \${text}\`;
          messageContainer.appendChild(messageDiv);
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      </script>
    </body>
    </html>
  `;
}

async function sendChatGPTMessage(prompt: string): Promise<string> {
  const apiKey = 'sk-xxx'; // 请替换为你的 OpenAI API 密钥
  const apiURL = 'https://api.openai.com/v1/chat/completions'; // 更新 API URL

  try {
    console.log('Sending request to OpenAI API with prompt:', prompt);
    const response = await axios.post(apiURL, {
      model: "gpt-3.5-turbo", // 确保使用正确的模型名称
      messages: [{ role: "user", content: prompt }], // 更新请求格式
      max_tokens: 150,
      temperature: 0.9
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    console.log('Received response from OpenAI API:', response.data);

    if (response.data.choices && response.data.choices.length > 0) {
      const result = response.data.choices[0].message.content.trim();
      console.log('Response text:', result);
      return result;
    } else {
      console.log('No response choices from ChatGPT.');
      return 'No response from ChatGPT.';
    }
  } catch (error: any) {
    console.error('Error communicating with ChatGPT:', error);
    vscode.window.showErrorMessage('An error occurred: ' + (error.response ? error.response.data.error.message : error.message));
    return 'Error communicating with ChatGPT.';
  }
}
