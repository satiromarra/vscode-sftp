import { window, ViewColumn } from "vscode";
import provider from "./provider";

export default class Settings extends provider {
  protected cssVariables: { [name: string]: string; };
  protected id: string = 'Settings';
  protected title: string = `SFTP: Settings`;


  public showBak() {
    const panel = window.createWebviewPanel(
      'sftp.settings', // Identifies the type of the webview. Used internally
      'Cat Coding', // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = this.form();
  }

  private form() {
    return `<div>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
      <label>Nombre <input type='text'/></label><br/>
    </div>`;
  }
  /* 
    private updateConnection = async (params: object) => {
  
    }
    private editConnection = async (params: object) => {
      
  
    }
    private createConnection = async ({ connInfo, globalSetting }) => {
      connInfo = await this.parseBeforeSave({ connInfo });
      return commands.executeCommand("sftp.addConnection", connInfo, globalSetting ? 'Global' : undefined)
        .then(() => {
          console.log(this)
        }, (err = {}) => {
          console.log(err)
        });
    }
  
    private parseBeforeSave = async ({ connInfo }) => {
      // const pluginExt = await driverPluginExtension(connInfo.driver);
      // if (pluginExt && pluginExt.parseBeforeSaveConnection) {
      //   connInfo = await pluginExt.parseBeforeSaveConnection({ connInfo });
      // }
      // ['id', 'isConnected', 'isActive', 'isPasswordResolved'].forEach(p => delete connInfo[p]);
      return connInfo;
    } */
}