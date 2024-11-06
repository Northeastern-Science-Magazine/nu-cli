import { existsSync, readFileSync } from "fs";
import path from "path";

/**
 * Returns the JSON of the `nucli.config.json` file in the current working directory. Returns an error
 * if the `nucli.config.json` file does not exist in the current working directory.
 *
 * @returns {Object}
 */
export default function getConfigData() {
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
