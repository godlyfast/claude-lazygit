import simpleGit from "simple-git";
import { spawnSync } from "node:child_process";

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  const diff = await git.diff(["--cached"]);
  return diff;
}

export async function isGitRepo(): Promise<boolean> {
  return git.checkIsRepo();
}

export async function commitWithEditor(message: string): Promise<void> {
  // Use -e to open editor, allowing user to edit before committing
  // Spawn directly to inherit TTY for proper editor interaction
  const result = spawnSync("git", ["commit", "-e", "-m", message], {
    stdio: "inherit",
  });

  // Check for spawn errors first (git not found, etc.)
  if (result.error) {
    const err = result.error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error("Git command not found. Is git installed?");
    }
    throw new Error(`Failed to run git: ${err.message}`);
  }

  // Check if terminated by signal (e.g., user pressed Ctrl+C)
  if (result.signal) {
    throw new Error(`Git commit was cancelled (signal: ${result.signal})`);
  }

  // Check exit code
  if (result.status !== 0) {
    throw new Error(`Git commit failed with exit code ${result.status}`);
  }
}
