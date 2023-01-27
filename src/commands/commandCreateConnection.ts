import { window, ViewColumn } from "vscode";
import { COMMAND_CREATE_CONNECTION } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import Settings from '../webview/settings';

export default checkCommand({
  id: COMMAND_CREATE_CONNECTION,
  async handleCommand() {
    const pane = new Settings();
    pane.show();
  }
});
