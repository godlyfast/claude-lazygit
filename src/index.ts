#!/usr/bin/env node
import { cli } from "cleye";
import { run } from "./run";
import { installLazygit, uninstallLazygit } from "./setup";

// Check for subcommands before parsing with cleye
const args = process.argv.slice(2);
if (args[0] === "install") {
  const skipConfirm = args.includes("-y") || args.includes("--yes");
  installLazygit(skipConfirm);
} else if (args[0] === "uninstall") {
  const skipConfirm = args.includes("-y") || args.includes("--yes");
  uninstallLazygit(skipConfirm);
} else {
  const argv = cli({
    name: "claude-lazygit",
    version: "1.1.0",
    flags: {
      verbose: {
        type: Boolean,
        description: "Enable verbose output",
        default: false,
        alias: "v",
      },
      commit: {
        type: Boolean,
        description: "Commit directly after accepting message",
        default: false,
        alias: "c",
      },
      print: {
        type: Boolean,
        description: "Print message only (no UI, for lazygit integration)",
        default: false,
        alias: "p",
      },
    },
    help: {
      description: "AI-powered commit message generator using Claude Code CLI",
      examples: [
        "claude-lazygit             # Interactive mode",
        "claude-lazygit -c          # Generate and commit directly",
        "claude-lazygit -p          # Print message only (for lazygit)",
        "claude-lazygit install     # Install lazygit integration",
        "claude-lazygit uninstall   # Remove lazygit integration",
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
    verbose: argv.flags.verbose,
    commit: argv.flags.commit,
    print: argv.flags.print,
  });
}
