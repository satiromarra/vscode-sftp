import { COMMAND_EDIT_CONNECTION, CONFIG_PATH } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import { ExplorerRoot } from "../modules/remoteExplorer";
import { FileServiceConfig } from "../core";
import Settings from "../webview/settings";
import * as path from "path";
import * as fse from 'fs-extra';
import { getWorkspaceFolders } from "../host";
import { getAllFileService } from "../modules/serviceManager";
import { window } from "vscode";

export default checkCommand({
  id: COMMAND_EDIT_CONNECTION,
  async handleCommand(exploreItem?: ExplorerRoot) {
    let remoteConfig, fileService;
    if (exploreItem && exploreItem.explorerContext) {
      fileService = exploreItem.explorerContext.fileService;
    } else {
      const remoteItems = getAllFileService().reduce<
        { label: string; fileService: any }[]
      >((result, fileService) => {
        result.push({
          label: fileService.name || fileService.baseDir,
          fileService,
        });

        return result;
      }, []);
      if (remoteItems.length <= 0) {
        return;
      }
      const item = await window.showQuickPick(remoteItems, {
        placeHolder: 'Select a folder...',
      });
      if (item === undefined) {
        return;
      }
      fileService = item.fileService;
    }

    let workspaces = getWorkspaceFolders();
    if (!workspaces) {
      return;
    }
    let configPath = path.join(workspaces[0].uri.fsPath, CONFIG_PATH);
    let configJson = await fse.readJson(configPath);
    if (!Array.isArray(configJson)) {
      configJson = [configJson];
    }
    const remotes = configJson.filter((e) => {
      return e.name == fileService.name;
    });
    remoteConfig = remotes[0];

    (new Settings()).show((remoteConfig || {}) as FileServiceConfig, fileService.name);
    return;
  }
});
