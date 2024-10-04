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

/**
 * Checks the current working directory for a `nucli.config.json` file.
 * @returns {Object}
 */
function checkConfig() {
  const configPath = path.join(process.cwd(), "nucli.config.json");

  if (!existsSync(configPath)) {
    console.error("Error: nucli.config.json file not found. Please ensure you're in the correct directory.");
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    console.error("Error: Invalid nucli.config.json.");
    process.exit(1);
  }
}

/**
 * Builds the correct `.env` file for the given service.
 * @param {String} serviceName
 * @param {String} serviceEnvironment
 * @param {String} databaseEnvironment
 */
function buildEnv(serviceName, serviceEnvironment, databaseEnvironment) {
  dotenv.config({ path: path.join(__dirname, ".env") });

  const resolvedEnvironment = serviceEnvironment || defaultEnvironments[serviceName];
  const envVars = configEnv[serviceName]?.[resolvedEnvironment];

  if (!defaultEnvironments[serviceName] || !envVars) {
    console.error("Error: Invalid service name or environment.");
    process.exit(1);
  }

  const dbEnvVars =
    serviceName === "backend" ? configEnv.database[databaseEnvironment === "remote" ? "remote" : resolvedEnvironment] : [];

  const envFileContent = [...envVars, ...dbEnvVars]
    .map((envVar) => `${envVar.replace(/^(FE_|BE_|DB_)(SS|CS|RS)_/, "")}=${process.env[envVar]}`)
    .join("\n");

  writeFileSync(path.join(process.cwd(), ".env"), envFileContent, "utf8");

  return { service: serviceName, environment: resolvedEnvironment, database: databaseEnvironment || resolvedEnvironment };
}

/**
 * Executes a Docker command and handles errors.
 * @param {String} command
 */
function executeDocker(command) {
  try {
    execSync(`docker compose --project-name nusci ${command}`, { stdio: "ignore" });
  } catch (error) {
    console.error(`Error while executing Docker command: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Links the project at the cwd to the nu-cli
 */
function link() {
  const configData = checkConfig();
  console.log(`Linking ${configData.service} service to the nu-cli`);

  const { service, environment, database } = buildEnv(configData.service);
  executeDocker("up -d");

  updateStatus(service, environment);
  updateStatus("database", database);
  console.log("Service linked successfully.");
  status();
}

/**
 * Unlinks the project at the cwd
 */
function unlink() {
  const configData = checkConfig();
  console.log(`Unlinking all services from the nu-cli`);

  executeDocker("down");
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
  const configData = checkConfig();

  if (databaseEnvironment && databaseEnvironment !== "remote" && serviceEnvironment !== databaseEnvironment) {
    console.error("Error: The database environment must be 'remote' if specified");
    process.exit(1);
  }

  const { service, environment, database } = buildEnv(configData.service, serviceEnvironment, databaseEnvironment);

  executeDocker("up -d");
  updateStatus(service, environment);
  updateStatus("database", database);
  console.log("Environment successfully changed.");
  status();
}

/**
 * Updates the `cli-status.json` file to have the given service and environment.
 * @param {String} service frontend | backend
 * @param {String} environment
 */
function updateStatus(service, environment) {
  const statusPath = path.join(__dirname, "cli-status.json");
  const statusData = JSON.parse(readFileSync(statusPath, "utf8"));

  statusData[service] = environment;
  writeFileSync(statusPath, JSON.stringify(statusData, null, 2), "utf8");
}

/**
 * Prints colored strings
 * @param {Array} stringsWithColors
 * @returns {String}
 */
function print(stringsWithColors) {
  const splitStrings = stringsWithColors.map(({ str }) => str.trim().split("\n"));
  const maxLines = Math.max(...splitStrings.map((lines) => lines.length));
  const maxLineLengths = splitStrings.map((lines) => Math.max(...lines.map((line) => line.length)));
  const combinedLines = Array.from({ length: maxLines }, (_, lineIndex) => {
    return stringsWithColors
      .map(({ color }, i) => {
        const line = splitStrings[i][lineIndex] || "";
        return `${color}${line.padEnd(maxLineLengths[i], " ")}\x1b[0m`;
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
  const statusData = JSON.parse(readFileSync(statusPath, "utf8"));
  const elements = {
    FE: `┏━━┓\n┃FE┃\n┗━━┛`,
    BE: `┏━━┓\n┃BE┃\n┗━━┛`,
    DB: `┏━━┓\n┃DB┃\n┗━━┛`,
    REMOTE: `┏╌╌┓\n┆DB┆\n┗╌╌┛`,
    CONN: `\n<---\n    \n--->`,
  };

  const statusOutput = [
    { str: elements.FE, color: statusData.frontend ? "\x1b[32m" : "\x1b[90m" },
    { str: elements.CONN, color: statusData.backend === "connected" ? "\x1b[32m" : "\x1b[90m" },
    { str: elements.BE, color: statusData.backend ? "\x1b[32m" : "\x1b[90m" },
    { str: elements.CONN, color: statusData.backend && statusData.database ? "\x1b[32m" : "\x1b[90m" },
    {
      str: statusData.database === "remote" ? elements.REMOTE : elements.DB,
      color: statusData.database ? "\x1b[32m" : "\x1b[90m",
    },
  ];

  console.log(print(statusOutput));
}

nucli.command("link").description("Link this service to the CLI").action(link);

nucli.command("unlink").description("Unlink all services from the CLI").action(unlink);

nucli.command("env <environment> [database]").description("Changes the Docker environment.").action(changeEnvironments);

nucli.command("status").description("The status of the nu-cli").action(status);

nucli.parse(process.argv);
