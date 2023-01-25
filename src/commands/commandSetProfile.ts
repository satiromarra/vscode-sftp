import * as vscode from 'vscode';
import { COMMAND_SET_PROFILE } from '../constants';
import { showInformationMessage } from '../host';
import app from '../app';
import { getAllFileService } from '../modules/serviceManager';
import { checkCommand } from './abstract/createCommand';
import { FileService } from '../core';
import watcherService from '../modules/fileWatcher';
import logger from '../logger';

export default checkCommand({
  id: COMMAND_SET_PROFILE,

  async handleCommand() {
    const profiles = getAllFileService().reduce<Array<vscode.QuickPickItem & { value: string | null, service: FileService }>>(
      (acc, service) => {
        if (service.getAvaliableProfiles().length <= 0) {
          return acc;
        }
        service.getAvaliableProfiles().forEach(profile => {
          acc.push({
            value: profile.id,
            service: service,
            label: `${profile.name || service.name} | Profile: (${profile.id})` + (service.activeProfile === profile.id ? " | active" : ""),
          });
        });
        acc.push({
          value: null,
          service: service,
          label: `- UNSET PROFILE ${service.name} -`
        });
        return acc;
      },
      []
    );
    if (profiles.length <= 1) {
      showInformationMessage('No Avaliable Profile.');
      return;
    }

    const item = await vscode.window.showQuickPick(profiles, { placeHolder: 'select a profile' });
    if (item === undefined) return;
    app.sftpBarItem.showMsg(`SFTP: Set profile: ${item.label}`);
    logger.log(`SFTP: Set profile: ${item.label}`);
    item.service.activeProfile = item.value;
    // TODO: Revisar watcherService
    item.service.setWatcherService(watcherService);
    if (app.remoteExplorer) {
      app.remoteExplorer.refresh();
    }
  },
});
