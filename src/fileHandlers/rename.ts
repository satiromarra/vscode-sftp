import { fileOperations } from '../core';
import createFileHandler from './createFileHandler';
import { FileHandleOption } from './../fileHandlers/option';
import { refreshRemoteExplorer } from '../fileHandlers/shared';

export const renameRemote = createFileHandler<{ originPath: string }>({
  name: 'rename',
  async handle({ originPath }) {
    const remoteFs = await this.fileService.getRemoteFileSystem(this.config);
    const { localFsPath } = this.target;
    await fileOperations.rename(originPath, localFsPath, remoteFs);
  },
});

export const renameRemoteFile = createFileHandler<FileHandleOption>({
  name: 'renameRemoteFile',
  async handle(opts) {
    const remoteFs = await this.fileService.getRemoteFileSystem(this.config);
    const { remoteFsPath, remoteUri } = this.target;
    await fileOperations.rename(remoteFsPath, remoteUri.path, remoteFs);
  },
  transformOption() {
    const config = this.config;
    return {
      ignore: config.ignore,
    };
  },
  afterHandle() {
    refreshRemoteExplorer(this.target, false);
  },
});

export const renameRemoteFolder = createFileHandler<FileHandleOption>({
  name: 'renameRemoteFolder',
  async handle(opts) {
    const remoteFs = await this.fileService.getRemoteFileSystem(this.config);
    const { remoteFsPath, remoteUri } = this.target;
    await fileOperations.rename(remoteFsPath, remoteUri.path, remoteFs);
  },
  transformOption() {
    const config = this.config;
    return {
      ignore: config.ignore,
    };
  },
  afterHandle() {
    refreshRemoteExplorer(this.target, false);
  },
});