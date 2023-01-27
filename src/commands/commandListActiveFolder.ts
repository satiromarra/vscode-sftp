import * as path from 'path';
import { Uri } from 'vscode';
import { COMMAND_LIST_ACTIVEFOLDER } from '../constants';
import { showInformationMessage, showTextDocument } from '../host';
import { FileEntry, FileType } from '../core';
import { downloadFile, downloadFolder } from '../fileHandlers';
import { checkCommand } from './abstract/createCommand';
import { getActiveFolder } from './shared';
import { handleCtxFromUri } from '../fileHandlers';
import { listFiles, toLocalPath } from '../helper';

export default checkCommand({
  id: COMMAND_LIST_ACTIVEFOLDER,

  async handleCommand() {
    const folderUri = getActiveFolder();
    if (!folderUri) {
      return;
    }

    const ctx = handleCtxFromUri(folderUri);
    const config = ctx.config;
    const remotefs = await ctx.fileService.getRemoteFileSystem(config);
    let fileEntry: FileEntry[] = [];
    try {
      fileEntry = await remotefs.list(ctx.target.remoteFsPath);
    } catch (e) {
      showInformationMessage(e.message)
      return;
    }
    const filter = config.ignore ? file => !config.ignore!(file.fsPath) : undefined;

    const listItems = fileEntry.map(file => ({
      name: path.basename(file.fspath) + (file.type === FileType.Directory ? '/' : ''),
      fsPath: file.fspath,
      type: file.type,
      description: '',
      getFs: remotefs,
      filter,
    }));
    const selected = await listFiles(listItems);
    if (!selected) {
      return;
    }

    const localUri = Uri.file(
      toLocalPath(selected.fsPath, config.remotePath, ctx.fileService.baseDir)
    );
    if (selected.type !== FileType.Directory) {
      await downloadFile(localUri);
      try {
        await showTextDocument(localUri);
      } catch (error) {
        // ignore
      }
    } else {
      await downloadFolder(localUri);
    }
  },
});
