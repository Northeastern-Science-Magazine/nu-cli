import path from "path";
import { readFileSync } from "fs";
import { __dirname } from "../cd.js";

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
export default function status() {
  const statusPath = path.join(__dirname, "cli-status.json");
  const statusData = JSON.parse(readFileSync(statusPath, "utf8"));
  const elements = {
    FE: `
┏━━┓
┃FE┃
┗━━┛`,
    BE: `
┏━━┓
┃BE┃
┗━━┛`,
    DB: `
┏━━┓
┃DB┃
┗━━┛`,
    REMOTE: `
┏╌╌┓
┆DB┆
┗╌╌┛`,
    CONN: `
<---
    
--->`,
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
