import { COMMAND_DELETE_CONNECTION, CONFIG_PATH } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import { ExplorerRoot } from "../modules/remoteExplorer";
import * as path from "path";
import * as fse from 'fs-extra';
import { getWorkspaceFolders, showConfirmMessage } from "../host";
import { getAllFileService } from "../modules/serviceManager";
import { window } from "vscode";
import { saveNewConfiguration } from "../modules/config";

export default checkCommand({
  id: COMMAND_DELETE_CONNECTION,
  async handleCommand(exploreItem?: ExplorerRoot) {
    const workspaces = getWorkspaceFolders();
    if (!workspaces) {
      return;
    }
    let fileService;
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

    let configPath = path.join(workspaces[0].uri.fsPath, CONFIG_PATH);
    await showConfirmMessage(
      `Are you sure you want to delete '${fileService.name}'?`,
      'Delete',
      'Cancel'
    ).then((ok) => {
      if (ok !== true) {
        return
      }
      let configJson = fse.readJsonSync(configPath);
      if (!Array.isArray(configJson)) {
        configJson = [configJson];
      }
      const remotes = configJson.filter((e) => {
        return e.name !== fileService.name;
      });

      saveNewConfiguration(configPath, remotes);
    });
    return;
  }
});
