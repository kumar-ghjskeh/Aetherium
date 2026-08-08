import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const WORLD_ASSET_ROOT = "apps/web/public/world";

const FILE_ASSET_KINDS = new Set(["audio", "image", "model", "texture"]);
const PROCEDURAL_ASSET_KINDS = new Set(["procedural", "registry_placeholder"]);
const ALLOWED_LICENSES = new Set([
  "cc0",
  "mit",
  "original",
  "original_procedural",
  "public_domain"
]);
const ALLOWED_EXTENSIONS = new Set([
  ".avif",
  ".basis",
  ".bin",
  ".glb",
  ".gltf",
  ".jpg",
  ".jpeg",
  ".ktx2",
  ".mp3",
  ".ogg",
  ".png",
  ".svg",
  ".webp"
]);
const SOURCE_ONLY_EXTENSIONS = new Set([
  ".blend",
  ".exr",
  ".fbx",
  ".hdr",
  ".psd",
  ".tif",
  ".tiff",
  ".wav"
]);

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function readLiteral(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  return undefined;
}

function readObjectLiteral(node) {
  const value = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const propertyName = ts.isIdentifier(property.name)
      ? property.name.text
      : ts.isStringLiteral(property.name)
        ? property.name.text
        : null;
    if (!propertyName) {
      continue;
    }
    const propertyValue = readLiteral(property.initializer);
    if (propertyValue !== undefined) {
      value[propertyName] = propertyValue;
    }
  }
  return value;
}

export function parseWorldAssetManifest(sourceText) {
  const sourceFile = ts.createSourceFile(
    "assets.manifest.ts",
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );
  let entries = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sourceFile) === "WORLD_ASSETS_MANIFEST"
    ) {
      const initializer = node.initializer;
      if (initializer && ts.isArrayLiteralExpression(initializer)) {
        entries = initializer.elements
          .filter((element) => ts.isObjectLiteralExpression(element))
          .map((element) => readObjectLiteral(element));
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!entries) {
    throw new Error("WORLD_ASSETS_MANIFEST array was not found.");
  }
  return entries;
}

export function collectWorldAssetFiles(rootDirectory) {
  const assetRoot = path.join(rootDirectory, WORLD_ASSET_ROOT);
  if (!fs.existsSync(assetRoot)) {
    return [];
  }
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      const contents = fs.readFileSync(absolutePath);
      files.push({
        path: normalizePath(path.relative(rootDirectory, absolutePath)),
        sha256: crypto.createHash("sha256").update(contents).digest("hex"),
        sizeBytes: contents.byteLength
      });
    }
  }

  walk(assetRoot);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export function validateWorldAssetPipeline({ entries, files, registerText }) {
  const failures = [];
  const ids = new Set();
  const manifestPaths = new Set();
  const fileByPath = new Map(files.map((file) => [normalizePath(file.path), file]));
  const hashToPath = new Map();

  for (const entry of entries) {
    const id = typeof entry.id === "string" ? entry.id : "";
    const kind = typeof entry.kind === "string" ? entry.kind : "";
    const license = typeof entry.license === "string" ? entry.license : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      failures.push(`manifest: invalid kebab-case asset id '${id || "<missing>"}'`);
    } else if (ids.has(id)) {
      failures.push(`manifest: duplicate asset id '${id}'`);
    }
    ids.add(id);

    if (!registerText.includes(`\`${id}\``)) {
      failures.push(`asset register: missing manifest asset '${id}'`);
    }
    if (!ALLOWED_LICENSES.has(license)) {
      failures.push(`manifest: '${id}' uses unsupported or unclear license '${license}'`);
    }

    const assetPath = typeof entry.path === "string" ? normalizePath(entry.path) : null;
    if (PROCEDURAL_ASSET_KINDS.has(kind)) {
      if (license !== "original_procedural") {
        failures.push(`manifest: procedural asset '${id}' must use original_procedural license`);
      }
      if (assetPath) {
        failures.push(`manifest: procedural asset '${id}' must not point to a binary file`);
      }
      continue;
    }
    if (!FILE_ASSET_KINDS.has(kind)) {
      failures.push(`manifest: '${id}' uses unsupported asset kind '${kind}'`);
      continue;
    }
    if (!assetPath) {
      failures.push(`manifest: file-backed asset '${id}' is missing path metadata`);
      continue;
    }
    if (!assetPath.startsWith(`${WORLD_ASSET_ROOT}/`) || assetPath.includes("..")) {
      failures.push(`manifest: '${id}' must stay under ${WORLD_ASSET_ROOT}`);
      continue;
    }
    if (manifestPaths.has(assetPath)) {
      failures.push(`manifest: asset path '${assetPath}' is registered more than once`);
    }
    manifestPaths.add(assetPath);

    const extension = path.posix.extname(assetPath).toLowerCase();
    const basename = path.posix.basename(assetPath, extension);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      failures.push(`manifest: '${id}' uses unsupported runtime extension '${extension}'`);
    }
    if (!/^world-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(basename)) {
      failures.push(`manifest: '${id}' file must use the world-<district>-<role> naming pattern`);
    }
    for (const field of ["author", "compression", "sha256", "source"]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        failures.push(`manifest: '${id}' is missing ${field} metadata`);
      }
    }
    if (typeof entry.attributionRequired !== "boolean") {
      failures.push(`manifest: '${id}' is missing attributionRequired metadata`);
    }
    if (!Number.isInteger(entry.sizeBudgetBytes) || entry.sizeBudgetBytes <= 0) {
      failures.push(`manifest: '${id}' is missing a positive sizeBudgetBytes value`);
    }

    const file = fileByPath.get(assetPath);
    if (!file) {
      failures.push(`manifest: '${id}' references missing file '${assetPath}'`);
      continue;
    }
    if (typeof entry.sha256 === "string" && entry.sha256 !== file.sha256) {
      failures.push(`manifest: '${id}' sha256 does not match '${assetPath}'`);
    }
    if (Number.isInteger(entry.sizeBudgetBytes) && file.sizeBytes > entry.sizeBudgetBytes) {
      failures.push(`manifest: '${id}' exceeds its ${entry.sizeBudgetBytes} byte budget`);
    }
  }

  for (const file of files) {
    const normalizedFilePath = normalizePath(file.path);
    const extension = path.posix.extname(normalizedFilePath).toLowerCase();
    if (SOURCE_ONLY_EXTENSIONS.has(extension)) {
      failures.push(`runtime assets: source-only file '${normalizedFilePath}' must not be bundled`);
    } else if (!ALLOWED_EXTENSIONS.has(extension)) {
      failures.push(`runtime assets: unsupported file '${normalizedFilePath}'`);
    }
    if (!manifestPaths.has(normalizedFilePath)) {
      failures.push(`runtime assets: unregistered file '${normalizedFilePath}'`);
    }
    const duplicatePath = hashToPath.get(file.sha256);
    if (duplicatePath) {
      failures.push(`runtime assets: '${normalizedFilePath}' duplicates '${duplicatePath}'`);
    } else {
      hashToPath.set(file.sha256, normalizedFilePath);
    }
  }

  return failures;
}

export function createWorldAssetReport(entries, files) {
  const bytesByExtension = {};
  for (const file of files) {
    const extension = path.posix.extname(normalizePath(file.path)).toLowerCase() || "none";
    bytesByExtension[extension] = (bytesByExtension[extension] ?? 0) + file.sizeBytes;
  }
  return {
    fileBackedEntries: entries.filter((entry) => typeof entry.path === "string").length,
    manifestEntries: entries.length,
    runtimeFileCount: files.length,
    totalRuntimeBytes: files.reduce((total, file) => total + file.sizeBytes, 0),
    bytesByExtension
  };
}
