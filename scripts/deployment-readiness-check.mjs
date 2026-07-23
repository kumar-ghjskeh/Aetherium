import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  ".env.example",
  ".github/workflows/ci.yml",
  ".github/workflows/deployment-readiness.yml",
  "docs/operations/deployment-boundaries.md",
  "docs/operations/deployment.md",
  "docs/operations/environments.md",
  "docs/operations/environment-variables.md",
  "docs/operations/migrations.md",
  "docs/operations/rollback.md",
  "docs/operations/health-checks.md",
  "docs/operations/release-checklist.md",
  "docs/operations/backup-and-restore.md",
  "docs/operations/observability.md",
  "docs/roadmap/3d-world-readiness.md",
  "infrastructure/environments/README.md"
];

const requiredEnvironmentVariables = [
  "AETHERIUM_APP_ENV",
  "AETHERIUM_DATABASE_URL",
  "AETHERIUM_REDIS_URL",
  "AETHERIUM_REDIS_KEY_PREFIX",
  "AETHERIUM_OBJECT_STORAGE_ENDPOINT",
  "AETHERIUM_OBJECT_STORAGE_BUCKET",
  "AETHERIUM_OBJECT_STORAGE_DERIVED_ASSETS_BUCKET",
  "AETHERIUM_OBJECT_STORAGE_USER_AVATARS_BUCKET",
  "AETHERIUM_SESSION_COOKIE_NAME",
  "AETHERIUM_SESSION_SIGNING_SECRET",
  "AETHERIUM_SESSION_COOKIE_SECURE",
  "AETHERIUM_CORS_ORIGINS",
  "AETHERIUM_FILE_VAULT_VERIFY_UPLOADS",
  "AETHERIUM_AI_PROVIDER_DEFAULT",
  "AETHERIUM_AI_EXTERNAL_CALLS_ENABLED",
  "AETHERIUM_LOG_NAMESPACE",
  "AETHERIUM_REQUEST_ID_HEADER",
  "AETHERIUM_SECURITY_HEADERS_ENABLED",
  "AETHERIUM_METRICS_ENABLED",
  "AETHERIUM_ERROR_TRACKING_DSN",
  "AETHERIUM_BACKUP_BUCKET",
  "NEXT_PUBLIC_AETHERIUM_API_BASE_URL"
];

const requiredPackageScripts = ["ci", "deployment:check", "independence:check", "world:check"];

const failures = [];

function assertFileExists(relativeFilePath) {
  if (!fs.existsSync(path.join(root, relativeFilePath))) {
    failures.push(`${relativeFilePath}: required deployment-readiness file is missing`);
  }
}

for (const requiredFile of requiredFiles) {
  assertFileExists(requiredFile);
}

const envExamplePath = path.join(root, ".env.example");
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, "utf8");
  for (const variableName of requiredEnvironmentVariables) {
    if (!new RegExp(`^${variableName}=`, "m").test(envExample)) {
      failures.push(`.env.example: ${variableName} is required for deployment separation`);
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const scriptName of requiredPackageScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    failures.push(`package.json: missing ${scriptName} script`);
  }
}

if (!packageJson.scripts?.ci?.includes("deployment:check")) {
  failures.push("package.json: ci must include deployment:check");
}

const deploymentWorkflowPath = path.join(root, ".github/workflows/deployment-readiness.yml");
if (fs.existsSync(deploymentWorkflowPath)) {
  const workflow = fs.readFileSync(deploymentWorkflowPath, "utf8");
  if (/deploy/i.test(workflow) && !/no deployment/i.test(workflow)) {
    failures.push(
      ".github/workflows/deployment-readiness.yml: workflow must validate only and not deploy"
    );
  }
  if (!workflow.includes("pnpm run deployment:check")) {
    failures.push(".github/workflows/deployment-readiness.yml: must run pnpm run deployment:check");
  }
}

if (failures.length > 0) {
  console.error("Aetherium deployment-readiness check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Aetherium deployment-readiness check passed.");
