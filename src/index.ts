#!/usr/bin/env node
import { cli } from "cleye";
import { run } from "./run";
import { setupLazygit } from "./setup";

// Check for setup subcommand before parsing with cleye
const args = process.argv.slice(2);
if (args[0] === "setup") {
  const skipConfirm = args.includes("-y") || args.includes("--yes");
  setupLazygit(skipConfirm);
} else {
  const argv = cli({
    name: "claude-lazygit",
    version: "1.0.0",
    flags: {
      count: {
        type: Number,
        description: "Number of commit suggestions to generate",
        default: 5,
        alias: "n",
      },
      verbose: {
        type: Boolean,
        description: "Enable verbose output",
        default: false,
        alias: "v",
      },
    },
    help: {
      description: "AI-powered commit message generator using Claude Code CLI",
      examples: [
        "claude-lazygit             # Generate commit messages",
        "claude-lazygit -n 10       # Generate 10 suggestions",
        "claude-lazygit setup       # Setup lazygit integration",
        "claude-lazygit setup -y    # Setup without confirmation",
      ],
    },
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });

  run({
    count: argv.flags.count,
    verbose: argv.flags.verbose,
  });
}
