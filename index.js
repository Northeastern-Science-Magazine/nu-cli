#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nucli = new Command();

/**
 * Checks this current working directory for a `nucli.config.json` file.
 *
 * Returns the data from the config as a JS object if exists, throws if error.
 *
 * @returns {Object}
 */
function checkConfig() {
  const configPath = path.join(process.cwd(), "nucli.config.json");

  if (!existsSync(configPath)) {
    console.error("Error: nucli.config.json file not found. Please ensure you're in the correct directory.");
    process.exit(1);
  }

  try {
    const nucliConfigFile = readFileSync(configPath, "utf8");
    return JSON.parse(nucliConfigFile);
  } catch (error) {
    console.error("Error: Invalid nucli.config.json.");
    process.exit(1);
  }
}

/**
 * Builds the correct `.env` file for the given `serviceName` and the `environment`.
 *
 * Overwrites/creates the `.env` file in the current working directory.
 *
 * @param {String} serviceName
 */
function buildEnv(serviceName, environment, database) {
  dotenv.config({ path: path.join(__dirname, ".env") });

  const configEnv = {
    frontend: { default: [] },
    backend: {
      single: ["BE_SS_SERVER_HOSTNAME", "BE_SS_SERVER_PORT", "BE_SS_SERVER_TOKEN_KEY"],
      connected: ["BE_CS_SERVER_HOSTNAME", "BE_CS_SERVER_PORT", "BE_CS_SERVER_TOKEN_KEY"],
    },
    database: {
      single: [
        "DB_SS_MONGODB_INITDB_ROOT_USERNAME",
        "DB_SS_MONGODB_INITDB_ROOT_PASSWORD",
        "DB_SS_MONGODB_INITDB_PORT",
        "DB_SS_MONGODB_CONNECTION_STRING",
      ],
      connected: [
        "DB_CS_MONGODB_INITDB_ROOT_USERNAME",
        "DB_CS_MONGODB_INITDB_ROOT_PASSWORD",
        "DB_CS_MONGODB_INITDB_PORT",
        "DB_CS_MONGODB_CONNECTION_STRING",
      ],
      remote: [
        "DB_RS_MONGODB_INITDB_ROOT_USERNAME",
        "DB_RS_MONGODB_INITDB_ROOT_PASSWORD",
        "DB_RS_MONGODB_INITDB_PORT",
        "DB_RS_MONGODB_CONNECTION_STRING",
      ],
    },
  };

  const defaultEnvironments = {
    frontend: "default",
    backend: "single",
    database: "single",
  };

  if (!defaultEnvironments[serviceName]) {
    console.error("Error: Invalid service name.");
    process.exit(1);
  }

  const resolvedEnvironment = environment || defaultEnvironments[serviceName];
  const envVars = configEnv[serviceName]?.[resolvedEnvironment];

  if (!envVars) {
    console.error("Error: Invalid environment.");
    process.exit(1);
  }

  const dbEnvVars =
    serviceName === "backend" ? configEnv["database"]?.[database === "remote" ? "remote" : resolvedEnvironment] : [];

  const envFileContent = [...envVars, ...dbEnvVars]
    .map((envVar) => `${envVar.replace(/^(FE_|BE_|DB_)(SS|CS|RS)_/, "")}=${process.env[envVar]}`)
    .join("\n");

  writeFileSync(path.join(process.cwd(), ".env"), envFileContent, "utf8");

  return { service: serviceName, environment, database };
}

/**
 * Links the project at the cwd to the nu-cli
 */
function link() {
  const configData = checkConfig();
  console.log(`Linking ${configData.service} service to the nu-cli`);
  const { service, environment } = buildEnv(configData.service);

  try {
    execSync(`docker compose --project-name nusci up -d`, { stdio: "ignore" });
    updateStatus(service, environment);
    console.log("Service linked successfully.");
  } catch (error) {
    console.error("Error while linking service:", error.message);
    process.exit(1);
  }
}

/**
 * Unlinks the project at the cwd
 */
function unlink() {
  const configData = checkConfig();
  console.log(`Linking ${configData.service} service to the nu-cli`);
  try {
    execSync(`docker compose --project-name nusci down`, { stdio: "ignore" });
    updateStatus("backend", "");
    updateStatus("frontend", "");
    console.log("Service unlinked successfully.");
  } catch (error) {
    console.error("Error while unlinking service:", error.message);
    process.exit(1);
  }
}

/**
 * Changes the environment of the service that is in the cwd
 *
 * @param {*} environment
 */
function changeEnvironments(environment, database) {
  const configData = checkConfig();
  buildEnv(configData.service, environment, database);

  try {
    execSync(`docker compose --project-name nusci up -d`, { stdio: "ignore" });
    updateStatus(configData.service, environment);
    console.log("Service linked successfully.");
  } catch (error) {
    console.error("Error while changing environments:", error.message);
    process.exit(1);
  }
}

/**
 * Updates the `cli-status.json` file to have the
 * given service and environment.
 *
 * frontend:
 * backend: "single" | "connected" | "remote"
 * database: "local" | "remote"
 *
 * Where backend single/connected corresponds to a local database,
 * and a remote backend refers to a remote database.
 *
 * @param {String} service frontend | backend
 * @param {String} environment
 */
function updateStatus(service, environment) {
  const statusPath = path.join(__dirname, "cli-status.json");
  const statusFile = readFileSync(statusPath, "utf8");
  const statusData = JSON.parse(statusFile);

  if (service === "backend") {
    statusData.backend = environment;
    if (environment === "single") {
      statusData.database = "local";
    } else if (environment === "connected") {
      statusData.database = "local";
    } else if (environment === "remote") {
      statusData.database = "remote";
    } else {
      statusData.database = "";
    }
  } else if (service === "frontend") {
    statusData.frontend = environment;
  }
  writeFileSync(statusPath, JSON.stringify(statusData, null, 2), "utf8");
}

function print(stringsWithColors) {
  const splitStrings = stringsWithColors.map(({ str }) => str.trim().split("\n"));
  const maxLines = Math.max(...splitStrings.map((lines) => lines.length));
  const maxLineLengths = splitStrings.map((lines) => Math.max(...lines.map((line) => line.length)));
  const combinedLines = Array.from({ length: maxLines }, (_, lineIndex) => {
    return stringsWithColors
      .map(({ color }, i) => {
        const line = splitStrings[i][lineIndex] || "";
        const paddedLine = line.padEnd(maxLineLengths[i], " ");
        return `${color}${paddedLine}\x1b[0m`;
      })
      .join(" ");
  });
  return combinedLines.join("\n");
}

/**
 * Depicts the status of the cli
 */
function status() {
  const statusPath = path.join(__dirname, "cli-status.json");
  const statusFile = readFileSync(statusPath, "utf8");
  const statusData = JSON.parse(statusFile);
  const FE = `
┏━━┓
┃FE┃
┗━━┛
`;
  const BE = `
┏━━┓
┃BE┃
┗━━┛
`;
  const DB = `
┏━━┓
┃DB┃
┗━━┛
`;
  const REMOTE = `
┏╌╌┓
┆DB┆
┗╌╌┛
`;
  const CONN = `
<---
    
--->
`;

  // const statusOutput = [];

  // let frontendColor = "\x1b[32m";

  // statusOutput.push({ str: FE, color: frontendColor });

  // if (statusData.backend) {
  // }

  // const stringOutput = [
  //   { str: FE, color: "\x1b[32m" },
  //   { str: CONN, color: "\x1b[90m" },
  //   { str: BE, color: "\x1b[32m" },
  //   { str: CONN, color: "\x1b[32m" },
  //   { str: DB, color: "\x1b[32m" },
  // ];
  // const combined = print(stringOutput);
  // console.log(combined);
}

nucli
  .command("link")
  .description("Link this service to the CLI")
  .action(() => {
    link();
  });

nucli
  .command("unlink")
  .description("Unlink this service to the CLI")
  .action(() => {
    unlink();
  });

nucli
  .command("env <environment> [database]")
  .description("Changes the Docker environment.")
  .action((environment, database) => {
    changeEnvironments(environment, database);
  });

nucli
  .command("status")
  .description("The status of the nu-cli")
  .action(() => {
    status();
  });

nucli.parse(process.argv);
