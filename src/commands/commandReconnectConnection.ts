import { COMMAND_RECONNECT_CONNECTION } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import { ExplorerRoot } from "../modules/remoteExplorer";
import app from "../app";
import logger from "../logger";

export default checkCommand({
  id: COMMAND_RECONNECT_CONNECTION,
  async handleCommand(exploreItem: ExplorerRoot) {
    if (app.remoteExplorer.isOpen(exploreItem) == false) {
      return;
    }
    exploreItem.explorerContext.fileService.reconnect().then((ok) => {
      app.remoteExplorer.refresh(exploreItem);
      logger.info("Refresh list");
    }).catch((e) => {
      logger.error(e);
    });
    return;
  }
});
