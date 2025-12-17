import simpleGit from "simple-git";

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  const diff = await git.diff(["--cached"]);
  return diff;
}

export async function isGitRepo(): Promise<boolean> {
  return git.checkIsRepo();
}

export async function commit(message: string): Promise<void> {
  await git.commit(message);
}

export async function commitWithEditor(message: string): Promise<void> {
  const { spawnSync } = await import("node:child_process");
  // Use -e to open editor, allowing user to edit before committing
  // Spawn directly to inherit TTY for proper editor interaction
  const result = spawnSync("git", ["commit", "-e", "-m", message], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`git commit failed with exit code ${result.status}`);
  }
}
