
import { Webview, Uri } from "vscode";
import * as path from 'path';
import { FileServiceConfig } from "../core";

function getUri(webview: Webview, extensionPath: string, pathList: string[]) {
  pathList.unshift(extensionPath);
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


export function getWebviewContent(webview: Webview, extensionPath: string, config: FileServiceConfig, id?: string) {
  const webviewUri = getUri(webview, extensionPath, ["dist", "webview.js"]);
  const styleUri = getUri(webview, extensionPath, ["dist", "style.css"]);
  const ignore = config.ignore ? config.ignore.join(", ") : "";
  const ignoreremote = config.remoteExplorer?.filesExclude ? config.remoteExplorer.filesExclude.join(", ") : "";
  webview.onDidReceiveMessage((message) => {
    const command = message.command;
    switch (command) {
      case "requestConfigData":
        webview.postMessage({
          command: "receiveDataInWebview",
          id: id,
          config: config,
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
        <h3>Sftp Settings</h3>
        </header>
        <section id="config-block">
          <vscode-panels aria-label="Default">
            <vscode-panel-tab id="tab-1">Default</vscode-panel-tab>
            <vscode-panel-tab id="tab-2">Profiles</vscode-panel-tab>
            <vscode-panel-view id="view-1">
              <section id="config-form">
              <div class="form-row">
                <span class="title">Name</span>
                <span class="field"><vscode-text-field id="name" value="${config.name}" placeholder=""></vscode-text-field></span>
              </div>
              <fieldset>
                <legend>Remote settings</legend>
                <div class="form-row">
                  <span class="title">Protocol</span>
                  <span class="field"><vscode-radio-group id="protocol"  orientation="horizontal">
                    <vscode-radio value="sftp" ${config.protocol == 'sftp' ? 'checked' : ''}>SFTP</vscode-radio>
                    <vscode-radio value="ftp" ${config.protocol != 'sftp' ? 'checked' : ''}>FTP</vscode-radio>
                  </vscode-radio-group></span>
                </div>
                <div class="form-row" style="display: none;">
                  <span class="title">Secure</span>
                  <span class="field"><vscode-dropdown id="secure">
                    <vscode-option value="false" ${(config.secure == false || config.secure == undefined) ? 'checked' : ''}>Default</vscode-option>
                    <vscode-option value="true" ${(config.secure == true) ? 'checked' : ''}>Both</vscode-option>
                    <vscode-option value="control" ${config.secure == 'control' ? 'checked' : ''}>Control</vscode-option>
                    <vscode-option value="implicit" ${config.secure == 'implicit' ? 'checked' : ''}>Implicit</vscode-option>
                  </vscode-dropdown></span>
                </div>
                <div class="form-row">
                  <span class="title">Host</span>
                  <span class="field"><vscode-text-field id="host" value="${config.host || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Port</span>
                  <span class="field"><vscode-text-field id="port" value="${config.port || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Username</span>
                  <span class="field"><vscode-text-field id="username" value="${config.username || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Password</span>
                  <span class="field"><vscode-text-field id="password" value="${config.password || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Remote path</span>
                  <span class="field"><vscode-text-field id="remotePath"value="${config.remotePath || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Ignore remote files/folders</span>
                  <span class="field"><vscode-text-field id="ignoreRemote"value="${ignoreremote}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Private Key</span>
                  <span class="field"><vscode-text-field id="privateKeyPath" value="${config.privateKeyPath || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Pass Phrase of Private Key</span>
                  <span class="field"><vscode-text-field id="passphrase" value="${config.passphrase || ''}" placeholder=""></vscode-text-field></span>
                </div>
              </fieldset>
              <fieldset>
                <legend>Local settings</legend>
                <div class="form-row">
                  <span class="title">Local path</span>
                  <span class="field"><vscode-text-field id="context"value="${config.context || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Ignore local files/folders</span>
                  <span class="field"><vscode-text-field id="ignore"value="${ignore}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Upload file on save?</span>
                  <span class="field"><vscode-radio-group id="uploadOnSave"  orientation="horizontal">
                    <vscode-radio value="1" ${config.uploadOnSave == true ? 'checked' : ''}>Yes</vscode-radio>
                    <vscode-radio value="0" ${config.uploadOnSave != true ? 'checked' : ''}>No</vscode-radio>
                  </vscode-radio-group></span>
                </div>
                <div class="form-row">
                  <span class="title">Uses temp file on upload?</span>
                  <span class="field"><vscode-radio-group id="useTempFile"  orientation="horizontal">
                    <vscode-radio value="1" ${config.useTempFile == true ? 'checked' : ''}>Yes</vscode-radio>
                    <vscode-radio value="0" ${config.useTempFile != true ? 'checked' : ''}>No</vscode-radio>
                  </vscode-radio-group></span>
                </div>
              </fieldset>
              <fieldset>
                <legend>Watcher settings - Watch external modification</legend>
                <div class="form-row">
                  <span class="title">Files to watch</span>
                  <span class="field"><vscode-text-field id="watcherFiles"value="${config.watcher?.files || ''}" placeholder=""></vscode-text-field></span>
                </div>
                <div class="form-row">
                  <span class="title">Auto Upload?</span>
                  <span class="field"><vscode-radio-group id="watcherAutoUpload"  orientation="horizontal">
                    <vscode-radio value="1" ${config.watcher?.autoUpload == true ? 'checked' : ''}>Yes</vscode-radio>
                    <vscode-radio value="0" ${config.watcher?.autoUpload != true ? 'checked' : ''}>No</vscode-radio>
                  </vscode-radio-group></span>
                </div>
                <div class="form-row">
                  <span class="title">Auto Delete?</span>
                  <span class="field"><vscode-radio-group id="watcherAutoDelete"  orientation="horizontal">
                    <vscode-radio value="1" ${config.watcher?.autoDelete == true ? 'checked' : ''}>Yes</vscode-radio>
                    <vscode-radio value="0" ${config.watcher?.autoDelete != true ? 'checked' : ''}>No</vscode-radio>
                  </vscode-radio-group></span>
                </div>
              </fieldset>
              </section>
            </vscode-panel-view>
            <vscode-panel-view id="view-2">
              <section id="profiles">
                <div id="profiles-items"></div>
                <vscode-button id="add-profile">Add profile</vscode-button>
              </section>
            </vscode-panel-view>
          </vscode-panels>
          
          <vscode-divider></vscode-divider>
          <div style="text-align: right; display: block;">
            <vscode-button id="submit-button">Save</vscode-button>
          </div>
        </section>
        <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
      </body>
    </html>
  `;
}