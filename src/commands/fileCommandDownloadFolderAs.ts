import { COMMAND_DOWNLOAD_FOLDER_AS } from '../constants';
import { upath } from '../core';
import { downloadFolder, handleCtxFromUri } from '../fileHandlers';
import { checkFileCommand } from './abstract/createCommand';
import { Uri, window } from 'vscode';
import { ExplorerItem } from '../modules/remoteExplorer';

export default checkFileCommand({
  id: COMMAND_DOWNLOAD_FOLDER_AS,
  options: {},
  async getFileTarget(obj) {
    const item = (obj as ExplorerItem).resource.uri
    let { target } = handleCtxFromUri(item);
    if (!target) {
      return;
    }

    let remote = target.remoteUri;
    let local = target.localUri;
    if (!(remote instanceof Uri)) {
      return;
    }

    const filename = upath.basename(remote.fsPath);
    const result = await window.showInputBox({
      value: filename,
      prompt: 'Please input new folder name',
    });

    if (result !== undefined) {
      this.options.local = local.with({
        path: upath.join(upath.dirname(local.fsPath), result)
      });
      return remote;
    }
    return undefined;
  },

  async handleFile(ctx) {
    ctx.target.localResourceFromUri(this.options.local);
    await downloadFolder(ctx);
  },
});
