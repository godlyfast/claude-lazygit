import * as p from "@clack/prompts";
import { getStagedDiff, isGitRepo } from "./git";
import { generateCommitMessages } from "./claude";
import type { RunOptions } from "./types";

export async function run(options: RunOptions): Promise<void> {
  // Check if in a git repository
  if (!(await isGitRepo())) {
    console.error("Error: Not in a git repository");
    process.exit(1);
  }

  const diff = await getStagedDiff();

  if (!diff || diff.trim() === "") {
    console.error(
      "No staged changes found. Stage your changes with 'git add' first."
    );
    process.exit(1);
  }

  if (options.verbose) {
    console.error(`Diff length: ${diff.length} characters`);
  }

  p.intro("claude-lazygit");

  const spinner = p.spinner();
  spinner.start("Generating commit messages...");

  let suggestions;
  try {
    suggestions = await generateCommitMessages(
      diff,
      options.count,
      options.verbose
    );
  } catch (error) {
    spinner.stop("Failed to generate commit messages");
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  spinner.stop("Generated commit messages");

  if (!suggestions.commits || suggestions.commits.length === 0) {
    console.error("No commit messages generated");
    process.exit(1);
  }

  const selected = await p.select({
    message: "Select a commit message:",
    options: suggestions.commits.map((s) => ({
      value: s.message,
      label: s.message,
      hint: s.explanation,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled");
    process.exit(0);
  }

  p.outro("Selected commit message:");

  // Output to stdout for lazygit to capture
  console.log(selected);
}
