import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const selfRelativePath = path
  .relative(root, fileURLToPath(import.meta.url))
  .replaceAll(path.sep, "/");

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

const ignoredFiles = new Set(["pnpm-lock.yaml", selfRelativePath]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".env",
  ".ini",
  ".js",
  ".json",
  ".mako",
  ".md",
  ".mjs",
  ".py",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

const prohibitedContentPatterns = [
  {
    label: "reference to the prohibited private product category",
    pattern: /semiconductor/i
  },
  {
    label: "reference to a prohibited private jobs product",
    pattern: /jobs?[ _-]platform/i
  },
  {
    label: "reference to a prohibited private jobs repository slug",
    pattern: /jobs?[-_]platform/i
  },
  {
    label: "reference to a non-Aetherium private repository under the current GitHub owner",
    pattern: /github\.com\/kumar-ghjskeh\/(?!Aetherium(?:\.git)?(?:[\s'"`),/]|$))/i
  }
];

const genericEnvironmentNames = [
  "APP_ENV",
  "API_HOST",
  "API_PORT",
  "WEB_HOST",
  "WEB_PORT",
  "DATABASE_URL",
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_PORT",
  "REDIS_URL",
  "REDIS_PORT",
  "MINIO_ENDPOINT",
  "MINIO_ROOT_USER",
  "MINIO_ROOT_PASSWORD",
  "MINIO_BUCKET",
  "MINIO_API_PORT",
  "MINIO_CONSOLE_PORT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
  "CORS_ORIGINS"
];

const requiredEnvironmentNames = [
  "AETHERIUM_APP_ENV",
  "AETHERIUM_DATABASE_URL",
  "AETHERIUM_POSTGRES_DB",
  "AETHERIUM_POSTGRES_USER",
  "AETHERIUM_POSTGRES_PASSWORD",
  "AETHERIUM_REDIS_URL",
  "AETHERIUM_REDIS_KEY_PREFIX",
  "AETHERIUM_OBJECT_STORAGE_BUCKET",
  "AETHERIUM_SESSION_COOKIE_NAME",
  "NEXT_PUBLIC_AETHERIUM_API_BASE_URL"
];

const failures = [];

function relativePath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relPath = relativePath(fullPath);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        walk(fullPath);
      }
      continue;
    }

    if (ignoredFiles.has(relPath) || !textExtensions.has(path.extname(entry.name))) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    for (const { label, pattern } of prohibitedContentPatterns) {
      if (pattern.test(content)) {
        failures.push(`${relPath}: ${label}`);
      }
    }
  }
}

walk(root);

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const name of genericEnvironmentNames) {
  if (new RegExp(`^${name}=`, "m").test(envExample)) {
    failures.push(`.env.example: generic environment variable ${name} must be Aetherium-specific`);
  }
}

for (const name of requiredEnvironmentNames) {
  if (!new RegExp(`^${name}=`, "m").test(envExample)) {
    failures.push(`.env.example: required Aetherium environment variable ${name} is missing`);
  }
}

const compose = fs.readFileSync(path.join(root, "docker-compose.yml"), "utf8");
const genericComposePatterns = [
  {
    label: "generic Compose service name",
    pattern: /^\s{2}(postgres|redis|minio|api|web):/m
  },
  {
    label: "generic Compose volume name",
    pattern: /\b(postgres_data|redis_data|minio_data|web_next|web_node_modules)\b/
  },
  {
    label: "generic Compose container name",
    pattern: /container_name:\s*(postgres|redis|minio|api|web)\b/
  }
];

for (const { label, pattern } of genericComposePatterns) {
  if (pattern.test(compose)) {
    failures.push(`docker-compose.yml: ${label} must use an aetherium prefix`);
  }
}

if (
  !/AETHERIUM_REDIS_KEY_PREFIX:\s*["']?\$\{AETHERIUM_REDIS_KEY_PREFIX:-aetherium:\}["']?/.test(
    compose
  )
) {
  failures.push("docker-compose.yml: API service must default Redis keys to the aetherium: prefix");
}

if (failures.length > 0) {
  console.error("Aetherium independence check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Aetherium independence check passed.");
