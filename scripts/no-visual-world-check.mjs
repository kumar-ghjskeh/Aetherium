import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const packageFiles = [
  "package.json",
  "apps/web/package.json",
  "apps/api/package.json",
  "apps/worker/package.json",
  "packages/api-client/package.json",
  "packages/config/package.json",
  "packages/shared-types/package.json",
  "packages/testing/package.json",
  "packages/ui/package.json",
  "packages/validation/package.json"
];

const prohibitedDependencyNames = new Set([
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "@react-three/cannon",
  "@react-three/rapier",
  "@react-three/postprocessing",
  "cannon-es",
  "rapier",
  "@dimforge/rapier3d-compat"
]);

const prohibitedAssetExtensions = new Set([".blend", ".fbx", ".glb", ".gltf"]);
const ignoredDirectories = new Set([
  ".git",
  ".mypy_cache",
  ".next",
  ".pytest_cache",
  ".ruff_cache",
  ".turbo",
  "__pycache__",
  "coverage",
  "dist",
  "node_modules"
]);

const failures = [];

function relativePath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function readPackageJson(relativeFilePath) {
  const absoluteFilePath = path.join(root, relativeFilePath);
  if (!fs.existsSync(absoluteFilePath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(absoluteFilePath, "utf8"));
  for (const dependencyBlock of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies"
  ]) {
    const dependencies = packageJson[dependencyBlock] ?? {};
    for (const dependencyName of Object.keys(dependencies)) {
      if (prohibitedDependencyNames.has(dependencyName)) {
        failures.push(
          `${relativeFilePath}: ${dependencyBlock} must not include ${dependencyName} before the visual 3D phase`
        );
      }
    }
  }
}

function scanLockfile() {
  const lockfilePath = path.join(root, "pnpm-lock.yaml");
  if (!fs.existsSync(lockfilePath)) {
    return;
  }

  const lockfile = fs.readFileSync(lockfilePath, "utf8");
  for (const dependencyName of prohibitedDependencyNames) {
    const escapedName = dependencyName.replaceAll("/", "\\/");
    const pattern = new RegExp(`(?:^|\\n)\\s{2,}${escapedName}:`, "i");
    if (pattern.test(lockfile)) {
      failures.push(
        `pnpm-lock.yaml: ${dependencyName} must not be installed before the visual 3D phase`
      );
    }
  }
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(fullPath);
      }
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (prohibitedAssetExtensions.has(extension)) {
      failures.push(`${relativePath(fullPath)}: visual 3D asset files are intentionally deferred`);
    }
  }
}

for (const packageFile of packageFiles) {
  readPackageJson(packageFile);
}
scanLockfile();
walk(root);

if (failures.length > 0) {
  console.error("Aetherium visual-world deferral check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Aetherium visual-world deferral check passed.");
