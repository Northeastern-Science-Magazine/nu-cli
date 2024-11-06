import { execSync } from "child_process";

/**
 * Executes a Docker command and handles errors.
 *
 * @param {String} command
 */
export default function buildDocker(command) {
  try {
    execSync(`docker compose --project-name nusci ${command}`, { stdio: "ignore", shell: true });
  } catch (error) {
    console.error(`Error while executing Docker command: ${error.message}`);
    process.exit(1);
  }
}
