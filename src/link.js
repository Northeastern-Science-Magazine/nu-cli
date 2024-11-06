import getConfigData from "./utils/get-config-data.js";
import generateEnv from "./utils/generate-env-files.js";
import buildDocker from "./utils/build-docker.js";
import updateStatus from "./utils/update-status.js";
import status from "./status.js";

import { __dirname } from "../cd.js";

/**
 * Links the project at the cwd to the nu-cli
 *
 * @TODO Link will eventually need to merge the compose-yaml files
 * of all services into a single compose-yaml file in this directory,
 * with references to each of the paths for (build, volume). Need to
 * write a set of instructions that replaces the `.` with the relative
 * path between this directory and the cwd.
 * https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/
 * https://docs.docker.com/compose/how-tos/multiple-compose-files/extends/
 * https://docs.docker.com/compose/how-tos/multiple-compose-files/include/
 * Probably merge or have a program to merge the yaml files that are linked
 * to the CLI and then save it here. Then write it back to the directory and
 * then call compose. gitignores on both.
 *
 */
export default function link() {
  const configData = getConfigData();
  console.log(`Linking ${configData.service} service to the nu-cli`);

  const { service, environment, database } = generateEnv(__dirname, configData.service);
  buildDocker("up -d");

  updateStatus(service, environment);
  updateStatus("database", database);
  console.log("Service linked successfully.");
  status();
}
