import { COMMAND_RECONNECT_CONNECTION } from "../constants";
import { checkCommand } from "./abstract/createCommand";
import app from "../app";
import logger from "../logger";
import { ExplorerRoot } from "../modules/remoteExplorer";

export default checkCommand({
  id: COMMAND_RECONNECT_CONNECTION,
  async handleCommand(exploreItem: ExplorerRoot) {
    exploreItem.explorerContext.fileService.setConnecting();
    app.remoteExplorer.refresh(undefined);
    exploreItem.explorerContext.fileService.reconnect().then((ok) => {
      app.remoteExplorer.refresh(undefined);
      logger.info("Refresh list");
    }).catch((e) => {
      logger.error(e);
    });
    return;
  }
});
