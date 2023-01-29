import { COMMAND_CREATE_CONNECTION } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import { FileServiceConfig } from "../core";
import Settings from "../webview/settings";

export default checkCommand({
  id: COMMAND_CREATE_CONNECTION,
  async handleCommand() {

    let newConfig = Object.create({
      name: "new configuration",
      protocol: "sftp",
      port: 22,
      context: "./",
      remotePath: "~/",
      uploadOnSave: true,
      useTempFile: true,
      ignore: [".vscode", ".git", ".DS_Store", ".github/**", ".ci"]
    }) as FileServiceConfig;

    (new Settings()).show(newConfig);

    return;
  }
});