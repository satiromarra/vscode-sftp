import { window, ViewColumn, WebviewPanel, Uri, ExtensionContext } from "vscode";
import app from "../app";
import * as path from "path";
import * as fse from 'fs-extra';
import { getWebviewContent } from "./content";
import { FileServiceConfig } from "../core";
import { getWorkspaceFolders, showErrorMessage } from "../host";
import { saveNewConfiguration } from "../modules/config";
import { CONFIG_PATH } from "../constants";
let panel: WebviewPanel | undefined = undefined;

export default class Settings {
  protected cssVariables: { [name: string]: string; };
  protected id: string = 'Settings';
  protected title: string = `SFTP: Settings`;

  public async show(remoteConfig: FileServiceConfig, fileService?: string) {
    const context: ExtensionContext = app.ctx;

    const workspaces = getWorkspaceFolders();
    if (!workspaces) {
      return;
    }

    if (!panel) {
      panel = window.createWebviewPanel("editConnection", "title", {
        viewColumn: ViewColumn.One,
        preserveFocus: true
      }, {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        localResourceRoots: [Uri.file(path.join(context.extensionPath, "dist"))]
      });
    }
    panel.title = remoteConfig.name || remoteConfig.context || '';
    panel.webview.html = getWebviewContent(panel.webview, context.extensionPath, (remoteConfig || {}) as FileServiceConfig, fileService);
    panel.webview.onDidReceiveMessage((message) => {
      const command = message.command;
      const id = message.id;
      const config = message.config;
      const error = message.error;
      console.log({ command, id });
      let configPath = path.join(workspaces[0].uri.fsPath, CONFIG_PATH);
      let configJson = fse.readJsonSync(configPath);
      switch (command) {
        case "errorConfig":
          showErrorMessage(error);
          break;
        case "saveConfig":
          if (configJson.some((o) => {
            return o.name === config.name;
          })) {
            showErrorMessage(`The name ${config.name} already exists!`);
            return;
          }
          configJson.push(config);
          saveNewConfiguration(configPath, configJson);
          break;
        case "updateConfig":
          let remotes = Object.keys(configJson).filter((e) => {
            return configJson[e].name == id;
          });
          if (remotes.length) {
            let nId: number = parseInt(remotes[0]);
            configJson[nId] = {
              ...remoteConfig,
              ...config
            };
          } else {
            configJson.push({
              ...remoteConfig,
              ...config
            });
          }

          remotes = Object.keys(configJson).filter((e) => {
            return configJson[e].name == config.name;
          });
          if (remotes.length > 1) {
            showErrorMessage(`The name ${config.name} already exists!`);
            return;
          }
          saveNewConfiguration(configPath, configJson);
          break;
      }
    });
    panel.onDidDispose(() => {
      panel = undefined;
    });
  }
}
