import * as vscode from 'vscode';
import { showTextDocument } from '../../host';
import {
  upath,
  UResource,
  Resource,
  FileService,
  FileType,
  FileEntry,
  Ignore,
  ServiceConfig,
} from '../../core';
import {
  COMMAND_REMOTEEXPLORER_VIEW_CONTENT,
  COMMAND_REMOTEEXPLORER_EDITINLOCAL,
} from '../../constants';
import { getAllFileService } from '../serviceManager';
import { getExtensionSetting } from '../ext';
import logger from '../../logger';
import app from '../../app';
import { getIcon } from '../../utils';

type Id = number;

const previewDocumentPathPrefix = '/~ ';

const DEFAULT_FILES_EXCLUDE = ['.git', '.svn', '.hg', 'CVS', '.DS_Store'];
/**
 * covert the url path for a customed docuemnt title
 *
 *  There is no api to custom title.
 *  So we change url path for custom title.
 *  This is not break anything because we get fspth from uri.query.'
 */
function makePreivewUrl(uri: vscode.Uri) {
  // const query = querystring.parse(uri.query);
  // query.originPath = uri.path;
  // query.originQuery = uri.query;

  return uri.with({
    path: previewDocumentPathPrefix + upath.basename(uri.path),
    // query: querystring.stringify(query),
  });
}

export enum ItemType {
  ROOT = "root",
  FOLDER = "folder",
  FILE = "file",
}

interface ExplorerChild {
  resource: Resource;
  isDirectory: boolean;
  onDidExpand?: Function;
  onDidCollapse?: Function;
  isExpanded?: boolean;
  type?: string
}

export interface ExplorerRoot extends ExplorerChild {
  explorerContext: {
    fileService: FileService;
    config: ServiceConfig;
    id: Id;
  };
}

export type ExplorerItem = ExplorerRoot | ExplorerChild;

function dirFirstSort(fileA: ExplorerItem, fileB: ExplorerItem) {
  if (fileA.isDirectory === fileB.isDirectory) {
    return fileA.resource.fsPath.localeCompare(fileB.resource.fsPath);
  }

  return fileA.isDirectory ? -1 : 1;
}

export default class RemoteTreeData
  implements vscode.TreeDataProvider<ExplorerItem>, vscode.TextDocumentContentProvider {
  private _roots: ExplorerRoot[] = [];
  private _rootsMap: Map<Id, ExplorerRoot> = new Map();
  private _map: Map<vscode.Uri['query'], ExplorerItem>;

  private _onDidChangeFolder: vscode.EventEmitter<ExplorerItem> = new vscode.EventEmitter<
    ExplorerItem
  >();
  private _onDidChangeFile: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChangeTreeData: vscode.Event<ExplorerItem> = this._onDidChangeFolder.event;
  readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChangeFile.event;

  actionRootExpand = async (item: ExplorerItem) => {
    item.isExpanded = true;
    console.log("ExpandRoot!" + item.isExpanded);
    const root = (item as ExplorerRoot);
    if (!root.explorerContext.fileService.isConnected() && !root.explorerContext.fileService.isConnecting()) {
      root.explorerContext.fileService.setConnecting();
      app.remoteExplorer.refresh(undefined);
      root.explorerContext.fileService.connect().then((ok) => {
        app.remoteExplorer.refresh(undefined);
        console.log("Refresh list");
      }).catch((e) => {
        logger.error(e);
      });
    }
    console.log("Expended Root!");
  };
  actionRootCollapse = async (item: ExplorerItem) => {
    item.isExpanded = false;
    console.log("CollapseRoot!" + item.isExpanded);
  };
  actionItemExpand = async (item: ExplorerItem) => {
    item.isExpanded = true;
    console.log("ExpandItem!" + item.isExpanded);
  };
  actionItemCollapse = async (item: ExplorerItem) => {
    item.isExpanded = false;
    console.log("CollapseItem!" + item.isExpanded);
  };

  async reset(item?: ExplorerItem): Promise<any> {
    this._roots = [];
    //this._rootsMap = new Map();
    this._onDidChangeFolder.fire(item);
    return;
  }

  async refresh(item?: ExplorerItem): Promise<any> {
    // refresh root
    if (!item) {
      // clear cache
      this._roots = [];
      //this._rootsMap = new Map();
      this._onDidChangeFolder.fire();
      return;
    }

    if (item.isDirectory) {
      this._onDidChangeFolder.fire(item);
      // refresh top level files as well
      const children = await this.getChildren(item);
      children
        .filter(i => !i.isDirectory)
        .forEach(i => this._onDidChangeFile.fire(makePreivewUrl(i.resource.uri)));
    } else {
      const parent = await this.getParent(item);
      if (parent) {
        this._onDidChangeFolder.fire(parent);
      }
      this._onDidChangeFile.fire(makePreivewUrl(item.resource.uri));
    }
  }

  getTreeItem(item: ExplorerItem): vscode.TreeItem {
    const explorer = (item as ExplorerRoot).explorerContext;
    const isRoot = explorer !== undefined;
    let customLabel: string = "",
      customIcon,
      customState: vscode.TreeItemCollapsibleState | undefined = undefined;;

    if (isRoot) {
      customLabel = explorer.config.name || explorer.config.host;
      // customLabel = explorer.fileService.name;
      customIcon = getIcon(explorer.fileService.isConnected() ? 'cloud-connected' : 'cloud-disconnected');
      if (explorer.fileService.isConnecting()) {
        customState = undefined;
        customLabel += " (connecting...)"
      } else if (explorer.fileService.isConnected()) {
        customState = vscode.TreeItemCollapsibleState.Expanded;
      } else {
        customState = vscode.TreeItemCollapsibleState.Collapsed;
      }
      if (customState == vscode.TreeItemCollapsibleState.Expanded && !item.isExpanded) {
        customState = vscode.TreeItemCollapsibleState.Collapsed;
      }
    } else if (item.isDirectory) {
      customState = vscode.TreeItemCollapsibleState.Collapsed;
    }
    if (!customLabel) {
      customLabel = upath.basename(item.resource.fsPath);
    }
    const i = {
      label: customLabel,
      id: undefined,
      resourceUri: item.resource.uri,
      collapsibleState: customState,
      contextValue: item.isDirectory ? ItemType.FOLDER : ItemType.FILE,
      // collapsibleState: item.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : undefined,
      // contextValue: isRoot ? 'root' : item.isDirectory ? 'folder' : 'file',
      command: item.isDirectory
        ? undefined
        : {
          command: getExtensionSetting().downloadWhenOpenInRemoteExplorer
            ? COMMAND_REMOTEEXPLORER_EDITINLOCAL
            : COMMAND_REMOTEEXPLORER_VIEW_CONTENT,
          arguments: [item],
          title: 'View Remote Resource',
        },
      onDidExpand: () => { },
      onDidCollapse: () => { },
      iconPath: customIcon
    } as vscode.TreeItem;

    if (isRoot) {
      i.contextValue = ItemType.ROOT + (explorer.fileService.isConnected() ? "-connected" : "-disconnected");
      i.id = `${i.label}-${Date.now()}`;
    }
    return i;
  }

  async getChildren(item?: ExplorerItem): Promise<ExplorerItem[]> {
    if (!item) {
      return this._getRoots();
    }

    const root = this.findRoot(item.resource.uri);
    if (!root) {
      throw new Error(`Can't find config for remote resource ${item.resource.uri}.`);
    }
    if (item.type == ItemType.ROOT && !root.explorerContext.fileService.isConnected()) {
      console.log("Root is not connected");
      return [];
    }
    const config = root.explorerContext.config;
    const remotefs = await root.explorerContext.fileService.getRemoteFileSystem(config);
    const fileEntries = await remotefs.list(item.resource.fsPath);

    const filesExcludeList: string[] =
      config.remoteExplorer && config.remoteExplorer.filesExclude
        ? config.remoteExplorer.filesExclude.concat(DEFAULT_FILES_EXCLUDE)
        : DEFAULT_FILES_EXCLUDE;

    const ignore = new Ignore(filesExcludeList);
    function filterFile(file: FileEntry) {
      const relativePath = upath.relative(config.remotePath, file.fspath);
      return !ignore.ignores(relativePath);
    }

    return fileEntries
      .filter(filterFile)
      .map(file => {
        const isDirectory = file.type === FileType.Directory;
        const newResource = UResource.updateResource(item.resource, {
          remotePath: file.fspath,
        });
        const mapItem = this._map.get(newResource.uri.query);
        if (mapItem) {
          return mapItem;
        }
        const newItem = {
          type: item.isDirectory ? "dir" : "file",
          resource: UResource.updateResource(item.resource, {
            remotePath: file.fspath,
          }),
          isDirectory,
          isExpanded: item.isDirectory ? false : undefined,
          onDidExpand: async () => {
            await this.actionItemExpand(newItem);
          },
          onDidCollapse: async () => {
            await this.actionItemCollapse(newItem);
          }
        } as ExplorerItem;
        this._map.set(newItem.resource.uri.query, newItem);
        return newItem;

      })
      .sort(dirFirstSort);
  }

  async getParent(item: ExplorerChild): Promise<ExplorerItem> {
    const resourceUri = item.resource.uri;
    const root = this.findRoot(resourceUri);
    if (!root) {
      throw new Error(`Can't find config for remote resource ${resourceUri}.`);
    }

    if (item.resource.fsPath === root.resource.fsPath) {
      return root;
    }

    const fspath = upath.dirname(item.resource.fsPath);
    const newResource = UResource.updateResource(item.resource, {
      remotePath: fspath,
    });
    const mapItem = this._map.get(newResource.uri.query);
    if (mapItem) {
      return mapItem;
    } else {
      const newMapItem = {
        resource: newResource,
        isDirectory: true,
        type: item.isDirectory ? "dir" : "file"
      };
      this._map.set(newResource.uri.query, newMapItem);
      await this.getChildren(newMapItem);
      return newMapItem;
    }
  }

  findRoot(uri: vscode.Uri): ExplorerRoot | null | undefined {
    if (!this._rootsMap.size) {
      return null;
    }

    const rootId = UResource.makeResource(uri).remoteId;
    return this._rootsMap.get(rootId);
  }

  async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ): Promise<string> {
    const root = this.findRoot(uri);
    if (!root) {
      throw new Error(`Can't find remote for resource ${uri}.`);
    }

    const config = root.explorerContext.config;
    const remotefs = await root.explorerContext.fileService.getRemoteFileSystem(config);
    const buffer = await remotefs.readFile(UResource.makeResource(uri).fsPath);
    return buffer.toString();
  }

  showItem(item: ExplorerItem): void {
    if (item.isDirectory) {
      return;
    }

    showTextDocument(makePreivewUrl(item.resource.uri));
  }

  private _getRoots(): ExplorerRoot[] {
    if (this._roots.length) {
      return this._roots;
    }
    const oldRootMap = this._rootsMap;
    console.log({ old1: oldRootMap.size });
    this._roots = [];
    this._rootsMap = new Map();
    this._map = new Map();
    console.log({ old2: oldRootMap.size });
    getAllFileService().forEach(fileService => {
      const config = fileService.getConfig();
      const id = fileService.id;
      const item = oldRootMap.has(id) ? oldRootMap.get(id)! : {
        type: ItemType.ROOT,
        resource: UResource.makeResource({
          remote: {
            host: config.host,
            port: config.port,
          },
          fsPath: config.remotePath,
          remoteId: id,
        }),
        isDirectory: true,
        explorerContext: {
          fileService,
          config,
          id,
        },
        isExpanded: false,
        onDidExpand: async () => {
          this.actionRootExpand(item);
        },
        onDidCollapse: async () => {
          await this.actionRootCollapse(item);
        }
      } as ExplorerRoot;
      console.log(item.isExpanded);
      this._roots.push(item);
      this._rootsMap.set(id, item);
      this._map.set(item.resource.uri.query, item);
    });
    this._roots.sort((a, b) => a.explorerContext.config.remoteExplorer.order - b.explorerContext.config.remoteExplorer.order || a.explorerContext.fileService.name.localeCompare(b.explorerContext.fileService.name));
    return this._roots;
  }



  activateTreeViewEventHandlers = (treeView: vscode.TreeView<ExplorerItem>): void => {
    treeView.onDidCollapseElement((event: any) => {
      logger.info('Tree item was collapsed');

      event.element.isExpanded = false;
      if (event.element.onDidCollapse) {
        event.element.onDidCollapse();
      }
    });

    treeView.onDidExpandElement(async (event: any): Promise<void> => {
      logger.info('Tree item was expanded');
      event.element.isExpanded = true;
      if (event.element.onDidExpand) {
        await event.element.onDidExpand();
      }
      // this.refresh();
    });

    treeView.onDidChangeSelection(async (event: any) => {
      logger.info("tree item changed")
    });
  };
}
