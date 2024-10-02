#!/usr/bin/env node
import { Command } from "commander";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

const nucli = new Command();

nucli
  .option("-l, --link", "Link this service to the CLI")
  .option("--env <envName>", "Rebuild the service using an alternative .env file");

nucli.parse(process.argv);

const options = nucli.opts();

function link() {
  const configPath = path.join(process.cwd(), "nucli.config.json");

  if (!existsSync(configPath)) {
    console.error("Error: nucli.config file not found. Please make sure you're in the correct directory.");
    process.exit(1);
  }

  const config = readFileSync(configPath, "utf8");
  console.log(`Linking service: ${config}`);

  try {
    execSync(`docker compose up -d`, { stdio: "inherit" });
    console.log("Service linked successfully.");
  } catch (error) {
    console.error("Error while linking service:", error.message);
    process.exit(1);
  }
}

function rebuildWithEnv(envName) {
  const envPath = path.join(process.cwd(), `.env.${envName}`);

  if (!existsSync(envPath)) {
    console.error(`Error: .env.${envName} file not found.`);
    process.exit(1);
  }

  console.log(`Rebuilding containers with .env.${envName}...`);

  try {
    execSync(`docker compose --env-file ${envPath} up -d --build`, { stdio: "inherit" });
    console.log("Containers rebuilt successfully.");
  } catch (error) {
    console.error("Error while rebuilding containers:", error.message);
    process.exit(1);
  }
}

if (options.link) {
  link();
}

if (options.env) {
  rebuildWithEnv(options.env);
}