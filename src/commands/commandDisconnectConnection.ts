import { COMMAND_DISCONNECT_CONNECTION } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import app from "../app";
import logger from "../logger";
import { ExplorerRoot } from "../modules/remoteExplorer";
import { showInformationMessage } from "../host";

export default checkCommand({
  id: COMMAND_DISCONNECT_CONNECTION,
  async handleCommand(exploreItem: ExplorerRoot) {
    exploreItem.explorerContext.fileService.disconnect().then((ok) => {
      app.remoteExplorer.reset(undefined);
      logger.info("Reset list");
      showInformationMessage("The connection has been disconnected!");
    }).catch((e) => {
      logger.error(e);
    });
    return;
  }
});
