import { window, ViewColumn, WebviewPanel, ExtensionContext, Webview, Uri } from "vscode";
import { COMMAND_CREATE_CONNECTION, CONFIG_PATH } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import { ExplorerRoot } from "../modules/remoteExplorer";
import { getWorkspaceFolders } from "../host";
import * as path from 'path';
import * as fse from 'fs-extra';
import app from '../app';
import { ServiceConfig } from "../core";

export default checkCommand({
  id: COMMAND_CREATE_CONNECTION,
  async handleCommand(exploreItem?: ExplorerRoot) {
    const context: ExtensionContext = app.ctx;
    let remoteConfig, explorerContext;
    if (exploreItem && exploreItem.explorerContext) {
      explorerContext = exploreItem.explorerContext;
      remoteConfig = explorerContext.config;
    }
    let workspaces = getWorkspaceFolders();
    if (!workspaces) {
      return;
    }
    let panel: WebviewPanel | undefined = undefined;
    let configPath = path.join(workspaces[0].uri.fsPath, CONFIG_PATH);
    let jj = await fse.readJson(configPath);
    // console.log(context.extensionPath);
    // console.log(jj);
    remoteConfig = jj[explorerContext.id - 1];

    panel = window.createWebviewPanel("createConnection", "title", ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [Uri.file(path.join(context.extensionPath, "dist"))]
    });
    panel.title = remoteConfig.name || remoteConfig.context;
    panel.webview.html = getWebviewContent(panel.webview, context.extensionPath, remoteConfig, explorerContext.id);
    panel.webview.onDidReceiveMessage((message) => {
      const command = message.command;
      const config = message.config;
      switch (command) {
        case "updateConfig":
          console.log(config);
          break;
      }
    });
    panel.onDidDispose(() => {
      panel = undefined;
    });
    return;
  }
});
function getUri(webview: Webview, extensionPath: string, pathList: string[]) {
  pathList.unshift(extensionPath);
  // console.log(path.join(...pathList));
  // console.log(Uri.file(path.join(...pathList)));
  return webview.asWebviewUri(Uri.file(path.join(...pathList)));
}
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewContent(webview: Webview, extensionPath: string, config: ServiceConfig, id: number) {
  const webviewUri = getUri(webview, extensionPath, ["dist", "webview.js"]);
  const styleUri = getUri(webview, extensionPath, ["dist", "style.css"]);
  // console.log(webviewUri);
  // console.log(styleUri);

  webview.onDidReceiveMessage((message) => {
    const command = message.command;
    switch (command) {
      case "requestConfigData":
        webview.postMessage({
          command: "receiveDataInWebview",
          id: id,
          config: JSON.stringify(config),
        });
        break;
    }
  });

  const nonce = getNonce();

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" href="${styleUri}">
          <title>${config.name}</title>
      </head>
      <body id="webview-body">
        <header>
          <h1>${config.name}</h1>
          <div id="tags-container"></div>
        </header>
        <section id="config-form">
          <vscode-text-field id="name" value="${config.name}" placeholder="">Name</vscode-text-field>
          <vscode-radio-group id="protocol"  orientation="horizontal">
            <label slot="label">Protocol</label>
            <vscode-radio value="ftp" ${config.protocol == 'ftp' ? 'checked' : ''}>Ftp</vscode-radio>
            <vscode-radio value="sftp" ${config.protocol == 'sftp' ? 'checked' : ''}>SFTP</vscode-radio>
          </vscode-radio-group>
          <vscode-text-field id="host" value="${config.host || ''}" placeholder="">Host</vscode-text-field>
          <vscode-text-field id="port" value="${config.port || ''}" placeholder="">Port</vscode-text-field>
          <vscode-text-field id="username" value="${config.username || ''}" placeholder="">Username</vscode-text-field>
          <vscode-text-field id="password" value="${config.password || ''}" placeholder="">Password</vscode-text-field>
          <vscode-text-field id="context"value="${config.context || ''}" placeholder="">Local path</vscode-text-field>
          <vscode-text-field id="remotePath"value="${config.remotePath || ''}" placeholder="">Remote path</vscode-text-field>
          <vscode-divider></vscode-divider>
          <vscode-radio-group id="uploadOnSave"  orientation="horizontal">
            <label slot="label">Upload file on save?</label>
            <vscode-radio value="1" ${config.uploadOnSave == true ? 'checked' : ''}>Yes</vscode-radio>
            <vscode-radio value="0" ${config.uploadOnSave == false ? 'checked' : ''}>No</vscode-radio>
          </vscode-radio-group>
          <vscode-text-field id="privateKeyPath"value="${config.privateKeyPath || ''}" placeholder="">Privatekey</vscode-text-field>
          <vscode-button id="submit-button">Save</vscode-button>
        </section>
        <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
      </body>
    </html>
  `;
}