import { COMMAND_RENAME_FOLDER } from '../constants';
import { upath } from '../core';
import { checkFileCommand } from './abstract/createCommand';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { Uri, window } from 'vscode';
import { renameRemoteFolder } from '../fileHandlers';

export default checkFileCommand({
  id: COMMAND_RENAME_FOLDER,
  async getFileTarget(item, items) {
    let targets = await uriFromExplorerContextOrEditorContext(item, items);
    if (!targets) {
      return;
    }
    if (Array.isArray(targets)) {
      if (targets.length < 1) {
        return;
      }
      targets = targets.shift();
    }
    if (!(targets instanceof Uri)) {
      return;
    }
    const filename = upath.basename(targets.fsPath);
    const result = await window.showInputBox({
      value: filename,
      prompt: 'Please input new folder name',
    });

    if (result !== undefined) {
      return targets.with({ path: [upath.dirname(targets.fsPath), result].join('/') })
    }
    return undefined;
  },
  handleFile: renameRemoteFolder
});
