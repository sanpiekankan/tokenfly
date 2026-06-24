import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const packageRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(packageRoot, "..", "..");
const sourceReadmePath = path.join(repositoryRoot, "README.md");
const packageReadmePath = path.join(packageRoot, "README.md");

/**
 * Copies the repository README into the published package directory before packing.
 */
function syncReadme() {
  fs.copyFileSync(sourceReadmePath, packageReadmePath);
}

/**
 * Removes the generated package README after packing so the repository keeps one source file.
 */
function cleanReadme() {
  if (fs.existsSync(packageReadmePath)) {
    fs.rmSync(packageReadmePath);
  }
}

/**
 * Executes the requested README maintenance command for npm packaging hooks.
 */
function run() {
  const command = process.argv[2];

  if (command === "sync") {
    syncReadme();
    return;
  }

  if (command === "clean") {
    cleanReadme();
    return;
  }

  throw new Error(`Unsupported README sync command "${command}".`);
}

run();
