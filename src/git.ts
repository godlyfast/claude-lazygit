import simpleGit from "simple-git";
import { spawnSync } from "node:child_process";

const git = simpleGit();

function getConfiguredEditor(): string {
  // Check in git's order of precedence
  if (process.env.GIT_EDITOR) {
    return process.env.GIT_EDITOR;
  }

  // Check git config core.editor
  const gitConfig = spawnSync("git", ["config", "--get", "core.editor"], {
    encoding: "utf-8",
  });
  if (gitConfig.status === 0 && gitConfig.stdout.trim()) {
    return gitConfig.stdout.trim();
  }

  if (process.env.VISUAL) {
    return process.env.VISUAL;
  }

  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }

  return "vi"; // git's default fallback
}

function editorExists(editor: string): boolean {
  // Extract the actual command (first word) in case of args like "code --wait"
  const command = editor.split(/\s+/)[0];
  const result = spawnSync("which", [command], { encoding: "utf-8" });
  return result.status === 0;
}

export function checkEditor(): { editor: string; exists: boolean } {
  const editor = getConfiguredEditor();
  const exists = editorExists(editor);
  return { editor, exists };
}

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
