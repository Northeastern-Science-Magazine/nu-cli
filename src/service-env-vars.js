const serviceEnvVars = {
  frontend: { default: [] },
  backend: {
    testing: ["BE_TS_SERVER_HOSTNAME", "BE_TS_SERVER_PORT", "BE_TS_SERVER_TOKEN_KEY"],
    connected: ["BE_CS_SERVER_HOSTNAME", "BE_CS_SERVER_PORT", "BE_CS_SERVER_TOKEN_KEY"],
  },
  database: {
    testing: [
      "DB_TS_MONGODB_INITDB_ROOT_USERNAME",
      "DB_TS_MONGODB_INITDB_ROOT_PASSWORD",
      "DB_TS_MONGODB_INITDB_PORT",
      "DB_TS_MONGODB_CONNECTION_STRING",
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

const defaultServiceEnvironments = {
  frontend: "default",
  backend: "testing",
  database: "testing",
};

/**
 * Returns the names of the env variables that the specified service in the specified environment has.
 * If the service is `backend`, this function will return all env variable names for `backend` and `database`,
 * since these services live in the same repository.
 *
 * @param {string} serviceName The name of the service you want the env variable names for.
 * @param {string?} environment The environment of the given service that you want to env variable names for.
 * @param {string?} databaseEnvironment The optional databaseEnvironment param.
 * @returns {Array<string>} The Array of env variable names that this service in this particular environment has.
 */
export default function getEnvVarNames(serviceName, environment, databaseEnvironment) {
  // resolved environment, if environment is not given, use the default for this service
  const resolvedEnvironment = environment ?? defaultServiceEnvironments[serviceName];
  return [
    ...serviceEnvVars[serviceName]?.[resolvedEnvironment],
    ...(serviceName === "backend"
      ? serviceEnvVars.database[databaseEnvironment === "remote" ? "remote" : resolvedEnvironment]
      : []),
  ];
}
