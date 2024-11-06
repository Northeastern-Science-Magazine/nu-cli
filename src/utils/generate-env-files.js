import dotenv from "dotenv";
import path from "path";
import { writeFileSync } from "fs";

// In-Repo imports
import { __dirname } from "../../cd.js";
import getEnvVarNames from "./service-env-vars.js";

/**
 * Builds the correct `.env` file for the given service and environment. First, we ascertain the env variable
 * names for the given service and environment combination. Then, we truncate the prefix of the env specific
 * variables so that they become generically named. These variables are then concatenated into a string, then
 * written into an `.env` file in the working directory.
 *
 * @param {string} serviceName The name of the service you want the env variable names for.
 * @param {string?} serviceEnvironment The environment of the given service that you want to env variable names for.
 * @param {string?} databaseEnvironment The optional databaseEnvironment param.
 */
export default function generateEnv(serviceName, serviceEnvironment, databaseEnvironment) {
  dotenv.config({ path: path.join(__dirname, ".env") });

  const { service, environment, database, vars } = getEnvVarNames(serviceName, serviceEnvironment, databaseEnvironment);
  const envFileContent = vars
    .map((envVar) => `${envVar.replace(/^(FE_|BE_|DB_)(TS|CS|RS)_/, "")}=${process.env[envVar]}`)
    .join("\n");

  writeFileSync(path.join(process.cwd(), ".env"), envFileContent, "utf8");

  return { service: service, environment: environment, database: database };
}
