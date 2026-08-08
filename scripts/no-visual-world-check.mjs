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

const approvedDirectVisualDependencyNames = new Set([
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "@react-three/rapier",
  "@react-three/postprocessing",
  "@react-spring/three",
  "@types/three",
  "gsap",
  "three-stdlib",
  "zustand"
]);

const approvedTransitiveVisualDependencyNames = new Set([
  ...approvedDirectVisualDependencyNames,
  "@dimforge/rapier3d-compat",
  "@dimforge/rapier3d",
  "@react-spring/animated",
  "@react-spring/core",
  "@react-spring/rafz",
  "@react-spring/shared",
  "@react-spring/types",
  "@react-spring/web",
  "@react-spring/zdog",
  "camera-controls",
  "detect-gpu",
  "fflate",
  "its-fine",
  "maath",
  "meshline",
  "postprocessing",
  "potpack",
  "react-composer",
  "stats-gl",
  "suspend-react",
  "troika-three-text",
  "troika-three-utils",
  "tunnel-rat",
  "use-sync-external-store",
  "utility-types",
  "webgl-constants",
  "zustand"
]);

const prohibitedDependencyNames = new Set([
  "@babylonjs/core",
  "@babylonjs/loaders",
  "@playcanvas/engine",
  "@react-three/cannon",
  "@react-three/xr",
  "babylonjs",
  "cannon",
  "cannon-es",
  "matter-js",
  "pixi.js",
  "playcanvas",
  "rapier",
  "unity-webgl"
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
          `${relativeFilePath}: ${dependencyBlock} must not include unapproved visual dependency ${dependencyName}`
        );
      }
      if (
        approvedDirectVisualDependencyNames.has(dependencyName) &&
        relativeFilePath !== "apps/web/package.json"
      ) {
        failures.push(
          `${relativeFilePath}: approved World Mode dependency ${dependencyName} must be declared only in apps/web/package.json`
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
      failures.push(`pnpm-lock.yaml: unapproved visual dependency ${dependencyName} is installed`);
    }
  }

  for (const dependencyName of approvedDirectVisualDependencyNames) {
    const escapedName = dependencyName.replaceAll("/", "\\/");
    const pattern = new RegExp(`(?:^|\\n)\\s{2,}${escapedName}:`, "i");
    if (pattern.test(lockfile) && !approvedTransitiveVisualDependencyNames.has(dependencyName)) {
      failures.push(`pnpm-lock.yaml: visual dependency ${dependencyName} is not allowlisted`);
    }
  }
}

for (const packageFile of packageFiles) {
  readPackageJson(packageFile);
}
scanLockfile();

if (failures.length > 0) {
  console.error("Aetherium visual-world deferral check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Aetherium visual-world dependency policy check passed.");
