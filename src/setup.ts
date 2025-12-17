import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const LAZYGIT_CUSTOM_COMMAND = `  - key: "<c-a>"
    description: "Generate AI commit message"
    context: "files"
    command: "claude-lazygit -c"
    subprocess: true`;

function getLazygitConfigPath(): string {
  const platform = process.platform;

  if (platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "lazygit",
      "config.yml"
    );
  } else if (platform === "win32") {
    return path.join(os.homedir(), "AppData", "Local", "lazygit", "config.yml");
  } else {
    const xdgConfig = process.env.XDG_CONFIG_HOME;
    if (xdgConfig) {
      return path.join(xdgConfig, "lazygit", "config.yml");
    }
    return path.join(os.homedir(), ".config", "lazygit", "config.yml");
  }
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function removeClaudeLazygitBlock(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let inClaudeLazygitBlock = false;
  let blockStartIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is start of a new command block
    if (trimmed.startsWith("- key:")) {
      // Look ahead to check if this block contains claude-lazygit
      let containsClaudeLazygit = false;
      const currentIndent = line.indexOf("-");

      for (let j = i; j < lines.length; j++) {
        const checkLine = lines[j];
        const checkTrimmed = checkLine.trim();

        // Stop at next command at same level
        if (j > i && checkTrimmed.startsWith("- key:") && checkLine.indexOf("-") <= currentIndent) {
          break;
        }

        if (checkLine.includes("claude-lazygit")) {
          containsClaudeLazygit = true;
          break;
        }
      }

      if (containsClaudeLazygit) {
        inClaudeLazygitBlock = true;
        blockStartIndent = currentIndent;
        continue;
      } else {
        inClaudeLazygitBlock = false;
      }
    }

    // Skip lines in claude-lazygit block
    if (inClaudeLazygitBlock) {
      const currentIndent = line.search(/\S/);
      // Check if we're still in the block (indented deeper or empty line)
      if (trimmed === "" || currentIndent > blockStartIndent) {
        continue;
      }
      // We've exited the block
      inClaudeLazygitBlock = false;
    }

    result.push(line);
  }

  // Clean up multiple empty lines
  return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

export async function setupLazygit(skipConfirm = false): Promise<void> {
  const isTTY = process.stdout.isTTY;

  if (isTTY) {
    p.intro("claude-lazygit setup");
  }

  const configPath = getLazygitConfigPath();

  if (isTTY) {
    p.log.info(`Lazygit config path: ${configPath}`);
  } else {
    console.log(`Lazygit config path: ${configPath}`);
  }

  let existingConfig = "";
  let hadExistingConfig = false;

  if (fs.existsSync(configPath)) {
    existingConfig = fs.readFileSync(configPath, "utf-8");
    hadExistingConfig = existingConfig.includes("claude-lazygit");

    // Remove old claude-lazygit config
    if (hadExistingConfig) {
      existingConfig = removeClaudeLazygitBlock(existingConfig);
    }
  }

  // Skip confirmation if --yes flag or non-TTY
  if (!skipConfirm && isTTY) {
    const message = hadExistingConfig
      ? "Update claude-lazygit config?"
      : existingConfig
        ? "Add claude-lazygit to lazygit config?"
        : "Create lazygit config?";

    const shouldContinue = await p.confirm({ message });

    if (p.isCancel(shouldContinue) || !shouldContinue) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
  }

  let newConfig: string;

  if (existingConfig.includes("customCommands:")) {
    // Insert after customCommands:
    newConfig = existingConfig.replace(
      /customCommands:(\s*\n)?/,
      `customCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`
    );
  } else if (existingConfig.trim()) {
    // Add customCommands section at end
    newConfig = existingConfig.trimEnd() + `\n\ncustomCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`;
  } else {
    // Create new config
    newConfig = `customCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`;
  }

  ensureDirectoryExists(configPath);
  fs.writeFileSync(configPath, newConfig, "utf-8");

  const action = hadExistingConfig ? "updated" : "added";

  if (isTTY) {
    p.log.success(`Lazygit configuration ${action}!`);
    p.log.info("Press Ctrl+A in lazygit to generate AI commit messages");
    p.outro("Restart lazygit to apply changes");
  } else {
    console.log(`Lazygit configuration ${action}!`);
    console.log("Press Ctrl+A in lazygit to generate AI commit messages");
    console.log("Restart lazygit to apply changes");
  }
}
