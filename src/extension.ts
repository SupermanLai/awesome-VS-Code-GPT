import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('chatgpt-vscode.start', async () => {
    const apiKey = 'sk-api key';  // 请替换为你的 OpenAI API 密钥
    const prompt = await vscode.window.showInputBox({
      prompt: 'Enter your prompt for ChatGPT',
      placeHolder: 'Type a question or command...'
    });

    if (prompt) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [{"role": "user", "content": prompt}],
          max_tokens: 150
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const result = response.data.choices[0].message.content.trim();
        vscode.window.showInformationMessage(result);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          vscode.window.showErrorMessage('Error communicating with ChatGPT: ' + error.message);
        } else {
          vscode.window.showErrorMessage('An unknown error occurred: ' + String(error));
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}