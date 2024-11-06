import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { __dirname } from "../../cd.js";

/**
 * Updates the `cli-status.json` file to have the given service and environment.
 * @param {String} service frontend | backend
 * @param {String} environment
 */
export default function updateStatus(service, environment) {
  const statusPath = path.join(__dirname, "cli-status.json");
  const statusData = JSON.parse(readFileSync(statusPath, "utf8"));

  statusData[service] = environment;
  writeFileSync(statusPath, JSON.stringify(statusData, null, 2), "utf8");
}
