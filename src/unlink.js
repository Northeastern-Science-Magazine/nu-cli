import getConfigData from "./utils/get-config-data.js";
import buildDocker from "./utils/build-docker.js";
import updateStatus from "./utils/update-status.js";
import status from "./status.js";

/**
 * Unlinks the project at the cwd
 */
export default function unlink() {
  getConfigData();
  console.log(`Unlinking all services from the nu-cli`);

  buildDocker("down");
  ["backend", "frontend", "database"].forEach((srv) => updateStatus(srv, ""));
  console.log("Services unlinked successfully.");
  status();
}
