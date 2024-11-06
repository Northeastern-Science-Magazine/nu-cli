#!/usr/bin/env node
import { Command } from "commander";

// In-Repo imports
import { __dirname } from "./cd.js";
import getConfigData from "./src/utils/get-config-data.js";
import generateEnv from "./src/utils/generate-env-files.js";
import buildDocker from "./src/utils/build-docker.js";
import updateStatus from "./src/utils/update-status.js";

import status from "./src/status.js";
import link from "./src/link.js";

const nucli = new Command();

/**
 * Unlinks the project at the cwd
 */
function unlink() {
  const configData = getConfigData();
  console.log(`Unlinking all services from the nu-cli`);

  buildDocker("down");
  ["backend", "frontend", "database"].forEach((srv) => updateStatus(srv, ""));
  console.log("Services unlinked successfully.");
  status();
}

/**
 * Changes the environment of the service that is in the cwd
 * @param {String} serviceEnvironment
 * @param {String} databaseEnvironment
 */
function changeEnvironments(serviceEnvironment, databaseEnvironment) {
  const configData = getConfigData();

  if (databaseEnvironment && databaseEnvironment !== "remote" && serviceEnvironment !== databaseEnvironment) {
    console.error("Error: The database environment must be 'remote' if specified");
    process.exit(1);
  }

  const { service, environment, database } = generateEnv(configData.service, serviceEnvironment, databaseEnvironment);

  buildDocker("up -d");
  updateStatus(service, environment);
  updateStatus("database", database);
  console.log("Environment successfully changed.");
  status();
}

nucli.command("link").description("Link this service to the CLI").action(link);

nucli.command("unlink").description("Unlink all services from the CLI").action(unlink);

nucli.command("env <environment> [database]").description("Changes the Docker environment.").action(changeEnvironments);

nucli.command("status").description("The status of the nu-cli").action(status);

nucli.parse(process.argv);
