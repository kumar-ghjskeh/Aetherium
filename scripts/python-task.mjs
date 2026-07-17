import { spawnSync } from "node:child_process";

const moduleArgs = process.argv.slice(2);

if (moduleArgs.length === 0) {
  console.error("Usage: node scripts/python-task.mjs <module> [...args]");
  process.exit(2);
}

const candidates =
  process.platform === "win32"
    ? [
        { command: "py", args: ["-3", "-m"] },
        { command: "python", args: ["-m"] }
      ]
    : [
        { command: "python", args: ["-m"] },
        { command: "python3", args: ["-m"] }
      ];

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.args, ...moduleArgs], {
    stdio: "inherit"
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

console.error("Python 3.12 or later was not found on PATH.");
process.exit(1);
