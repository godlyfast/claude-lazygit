import * as p from "@clack/prompts";
import { getStagedDiff, isGitRepo, commitWithEditor, checkEditor } from "./git";
import { generateCommitMessage } from "./claude";
import type { RunOptions } from "./types";

export async function run(options: RunOptions): Promise<void> {
  if (!(await isGitRepo())) {
    console.error("Error: Not in a git repository");
    process.exit(1);
  }

  // Check editor availability early if we'll need it
  if (options.commit) {
    const { editor, exists } = checkEditor();
    if (!exists) {
      console.error(`Error: Editor '${editor}' not found.`);
      console.error("Set your preferred editor with one of:");
      console.error("  git config --global core.editor nano");
      console.error("  git config --global core.editor vim");
      console.error("  export EDITOR=nano");
      process.exit(1);
    }
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

  // Print mode: output numbered message for lazygit menuFromCommand
  if (options.print) {
    try {
      const message = await generateCommitMessage(diff, options.verbose);
      // Output only the first line (subject) in numbered format for lazygit
      const subject = message.split("\n")[0];
      console.log(`1. ${subject}`);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
    return;
  }

  // Interactive mode
  p.intro("claude-lazygit");

  let message: string | null = null;

  while (true) {
    const spinner = p.spinner();
    spinner.start("Generating commit message...");

    try {
      message = await generateCommitMessage(diff, options.verbose);
    } catch (error) {
      spinner.stop("Failed to generate commit message");
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }

    spinner.stop("Generated commit message");

    p.log.message(message);

    const action = await p.select({
      message: "What would you like to do?",
      options: [
        { value: "accept", label: "Accept", hint: options.commit ? "commit with this message" : "use this message" },
        { value: "regenerate", label: "Regenerate", hint: "generate a new message" },
        { value: "cancel", label: "Cancel", hint: "exit without committing" },
      ],
    });

    if (p.isCancel(action) || action === "cancel") {
      p.cancel("Cancelled");
      process.exit(0);
    }

    if (action === "accept") {
      break;
    }
    // Otherwise regenerate - loop continues
  }

  if (options.commit) {
    try {
      // Open editor with message pre-filled for user to review/edit
      await commitWithEditor(message!);
      p.outro("Committed!");
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  } else {
    p.outro("Commit message:");
    console.log(message);
  }
}
