import { commands, Disposable, WebviewPanel, ViewColumn, EventEmitter, window, Uri } from "vscode";
//import * as path from 'path';
import Context from "./context";
import { DefaultUIAction } from "./actions";

export default abstract class provider<State = any> implements Disposable {
  private panel: WebviewPanel;
  public disposeEvent: EventEmitter<void> = new EventEmitter();
  protected html: string;
  protected abstract id: string;
  protected abstract title: string;
  private disposables: Disposable[] = [];
  public whereToShow = ViewColumn.One;
  protected abstract cssVariables: { [name: string]: string };
  protected messagesHandler: (...args: any) => void;

  public constructor() { }
  public preserveFocus = true;

  get serializationId() {
    return this.id;
  }
  private get baseHtml(): string {
    const cssVariables = Object.keys(this.cssVariables || {})
      .map(k => `--sftp-${k}: ${this.cssVariables[k]}`)
      .join(';');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
  :root {${cssVariables}}
  </style>
  <link rel="stylesheet" type="text/css" href="${this.prepareUrl(Context.asAbsolutePath(`./dist/ui/commons.css`))}">
</head>
<body>
  <link rel="stylesheet" type="text/css" href="${this.prepareUrl(Context.asAbsolutePath(`./dist/ui/theme.css`))}">
  <div id="app-root"></div>
  <script src="${this.prepareUrl(
      Context.asAbsolutePath(`./dist/ui/vendor.js`)
    )}" type="text/javascript" charset="UTF-8"></script>
  <script src="${this.prepareUrl(
      Context.asAbsolutePath(`./dist/ui/commons.js`)
    )}" type="text/javascript" charset="UTF-8"></script>
  <script src="${this.prepareUrl(
      Context.asAbsolutePath(`./dist/ui/${this.id}.js`)
    )}" type="text/javascript" charset="UTF-8"></script>
</body>
</html>`;
  }

  public prepareUrl(localResource: Uri | string) {
    return this.panel && this.panel.webview
      ? this.panel.webview.asWebviewUri(Uri.file(localResource.toString()))
      : null;
  }

  public get onDidDispose() {
    return this.disposeEvent.event;
  }
  public get visible() {
    return this.panel === undefined ? false : this.panel.visible;
  }
  public hide = () => {
    if (this.panel === undefined) return;
    this.setPreviewActiveContext(false);
    this.panel.dispose();
  };

  public dispose = () => {
    this.hide();
    if (this.disposables.length) this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.panel.dispose();
    this.disposeEvent.fire();
  };

  private setPreviewActiveContext = (value: boolean) => {
    commands.executeCommand('setContext', `sftp.${this.id}.active`, value);
  };
  public onViewActive?: (active: boolean) => any;

  public show() {
    if (!this.panel) {
      console.log(Context.extensionPath);
      this.panel = window.createWebviewPanel(
        this.serializationId,
        this.title,
        {
          viewColumn: this.whereToShow,
          preserveFocus: true,
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true, // @OPTIMIZE remove and migrate to state restore
          enableCommandUris: true,
          // localResourceRoots: [Uri.file(Context.extensionPath), Uri.file(path.resolve(Context.extensionPath, '..'))],
          // enableFindWidget: true,
        }
      );
      return;
      // this.panel.iconPath = getIconPaths('database-active');
      this.panel.webview.onDidReceiveMessage(this.onDidReceiveMessage, null, this.disposables);
      this.panel.onDidChangeViewState(
        ({ webviewPanel }) => {
          this.setPreviewActiveContext(webviewPanel.active);
          this.onViewActive && this.onViewActive(webviewPanel.active);
        },
        null,
        this.disposables
      );
      this.panel.onDidDispose(this.dispose, null, this.disposables);
      this.panel.webview.html = this.html || this.baseHtml;
    } else {
      this.panel.reveal(undefined, this.preserveFocus);
    }

    this.updatePanelName();

    this.setPreviewActiveContext(true);
  }

  private lastState = undefined;
  public getState = (): Promise<any> => {
    if (!this.panel) return new Promise((resolve, reject) => {
      resolve(0);
    });

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(() => {
        if (typeof this.lastState === 'undefined') {
          if (attempts < 10) return attempts++;

          clearInterval(timer);
          return reject(new Error(`Could not get the state for ${this.panel.title}`));
        }
        clearInterval(timer);
        const state = this.lastState;
        this.lastState = undefined;
        return resolve(state);
      }, 200);
      this.panel.webview.postMessage({ action: DefaultUIAction.REQUEST_STATE });
    });
  };
  public updatePanelName = () => {
    if (this.panel) this.panel.title = this.title;
  };

  private onDidReceiveMessage = ({ action, payload, ...rest }) => {
    switch (action) {
      case DefaultUIAction.RESPONSE_STATE:
        this.lastState = payload;
        break;
      case DefaultUIAction.CALL:
        return commands.executeCommand(payload.command, ...(payload.args || []));
      case DefaultUIAction.NOTIFY_VIEW_READY:
        process.env.NODE_ENV === 'development' &&
          commands.executeCommand('workbench.action.webview.openDeveloperTools');
        break;
    }
    if (this.messagesHandler) {
      this.messagesHandler({ action, payload, ...rest });
    }
  };
}