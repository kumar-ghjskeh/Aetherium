import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  collectWorldAssetFiles,
  createWorldAssetReport,
  parseWorldAssetManifest,
  validateWorldAssetPipeline
} from "./world-asset-pipeline-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "apps/web/src/features/world/manifests/assets.manifest.ts");
const registerPath = path.join(root, "docs/world/asset-register.md");
const entries = parseWorldAssetManifest(fs.readFileSync(manifestPath, "utf8"));
const files = collectWorldAssetFiles(root);
const failures = validateWorldAssetPipeline({
  entries,
  files,
  registerText: fs.readFileSync(registerPath, "utf8")
});

if (failures.length > 0) {
  console.error("Aetherium world asset pipeline check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const report = createWorldAssetReport(entries, files);
if (process.argv.includes("--report")) {
  const reportDirectory = path.join(root, "artifacts");
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(reportDirectory, "world-assets-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
}

console.log(
  `Aetherium world asset pipeline passed: ${report.manifestEntries} manifest entries, ` +
    `${report.runtimeFileCount} runtime files, ${report.totalRuntimeBytes} bytes.`
);
