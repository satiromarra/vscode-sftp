import { COMMAND_RENAME_FILE } from '../constants';
import { upath } from '../core';
import { checkFileCommand } from './abstract/createCommand';
import { uriFromExplorerContextOrEditorContext } from './shared';
import { Uri, window } from 'vscode';
import { renameRemoteFile } from '../fileHandlers';

export default checkFileCommand({
  id: COMMAND_RENAME_FILE,
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
      prompt: 'Please input new file name',
    });

    if (result !== undefined) {
      return targets.with({
        path: upath.join(upath.dirname(targets.fsPath), result)
      })
    }
    return undefined;
  },
  handleFile: renameRemoteFile
});
