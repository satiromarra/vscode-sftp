import * as LRU from 'lru-cache';
import StatusBarItem from './ui/statusBarItem';
import { COMMAND_SET_PROFILE } from './constants';
import AppState from './modules/appState';
import RemoteExplorer from './modules/remoteExplorer';

interface App {
  fsCache: LRU.Cache<string, string>;
  state: AppState;
  sftpBarItem: StatusBarItem;
  remoteExplorer: RemoteExplorer;
}

const app: App = Object.create(null);

app.sftpBarItem = new StatusBarItem(
  () => {
    return 'SFTP';
    // return 'SFTP' + (new Date().toString());
  },
  'SFTP@satiromarra',
  COMMAND_SET_PROFILE
);
app.fsCache = LRU<string, string>({ max: 6 });

export default app;
