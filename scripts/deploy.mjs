/**
 * Deploy `dist/` to the `gh-pages` branch on origin.
 *
 * Replaces the `gh-pages` npm package, which on Windows blows up with
 * `ENAMETOOLONG` when the branch has >~800 files because it passes every
 * removed path as a command-line argument to `git rm`. We instead init a
 * throwaway repo inside `dist/`, `git add -A`, and force-push — never
 * pass a file list to git, so command-line length is a non-issue regardless
 * of how many files `dist/` holds.
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const branch = "gh-pages";
const remoteName = "origin";

if (!existsSync(dist)) {
  console.error("dist/ not found — run `npm run build` first.");
  process.exit(1);
}

const run = (cmd, cwd) =>
  execSync(cmd, { stdio: "inherit", cwd: cwd ?? process.cwd() });
const capture = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

const remoteUrl = capture(`git remote get-url ${remoteName}`);
const sha = capture("git rev-parse --short HEAD");
const message = `Deploy ${sha} @ ${new Date().toISOString()}`;

// Remove any leftover throwaway .git from a prior run.
const throwaway = path.join(dist, ".git");
if (existsSync(throwaway)) rmSync(throwaway, { recursive: true, force: true });

try {
  run("git init", dist);
  run(`git checkout -b ${branch}`, dist);
  run(`git remote add ${remoteName} "${remoteUrl}"`, dist);
  run("git add -A", dist);
  run(`git -c user.name=deploy -c user.email=deploy@local commit -m "${message}"`, dist);
  run(`git push --force ${remoteName} ${branch}:${branch}`, dist);
  console.log(`\nDeployed ${sha} to ${remoteName}/${branch}.`);
} finally {
  // Always clean up the throwaway .git so it doesn't interfere with the
  // next `npm run dev` or an accidental commit inside dist/.
  if (existsSync(throwaway)) rmSync(throwaway, { recursive: true, force: true });
}
