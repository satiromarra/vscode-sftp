import { window, ViewColumn, WebviewPanel, ExtensionContext } from "vscode";
import { COMMAND_CREATE_CONNECTION, CONFIG_PATH } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import Settings from '../webview/settings';
import { ExplorerRoot } from "../modules/remoteExplorer";
import { getWorkspaceFolders } from "../host";
import * as path from 'path';
import * as fse from 'fs-extra';

export default checkCommand({
  id: COMMAND_CREATE_CONNECTION,
  async handleCommand(exploreItem?: ExplorerRoot) {
    let remoteConfig;
    if (exploreItem && exploreItem.explorerContext) {
      remoteConfig = exploreItem.explorerContext.config;
    }
    let workspaces = getWorkspaceFolders();
    if (!workspaces) {
      return;
    }
    let panel: WebviewPanel | undefined = undefined;
    let configPath = path.join(workspaces[0].uri.fsPath, CONFIG_PATH);
    let jj = await fse.readJson(configPath);

    panel = window.createWebviewPanel("createConnection", "title", ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: []
    });
    panel.title = remoteConfig.name || remoteConfig.context;
    panel.webview.onDidReceiveMessage((message) => {
      console.log(message);
    });
    panel.onDidDispose(() => {
      panel = undefined;
    });
    return;
    const pane = new Settings();
    pane.show();
  }
});
