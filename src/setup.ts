import * as p from "@clack/prompts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const LAZYGIT_CUSTOM_COMMAND = `  - key: "<c-a>"
    description: "Generate AI commit message"
    context: "files"
    command: "claude-lazygit"
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
    // Linux and others
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

function configContainsClaudeLazygit(content: string): boolean {
  return content.includes("claude-lazygit");
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
  let configExists = false;

  if (fs.existsSync(configPath)) {
    configExists = true;
    existingConfig = fs.readFileSync(configPath, "utf-8");

    if (configContainsClaudeLazygit(existingConfig)) {
      if (isTTY) {
        p.log.success("claude-lazygit is already configured in lazygit!");
        p.outro("Setup complete");
      } else {
        console.log("claude-lazygit is already configured in lazygit!");
      }
      return;
    }
  }

  // Skip confirmation if --yes flag or non-TTY
  if (!skipConfirm && isTTY) {
    const shouldContinue = await p.confirm({
      message: configExists
        ? "Add claude-lazygit custom command to existing lazygit config?"
        : "Create lazygit config with claude-lazygit custom command?",
    });

    if (p.isCancel(shouldContinue) || !shouldContinue) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
  }

  let newConfig: string;

  if (configExists && existingConfig.trim()) {
    // Check if customCommands section exists
    if (existingConfig.includes("customCommands:")) {
      // Append to existing customCommands
      newConfig = existingConfig.replace(
        /customCommands:\s*\n/,
        `customCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`
      );
    } else {
      // Add customCommands section
      newConfig = existingConfig.trimEnd() + `\n\ncustomCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`;
    }
  } else {
    // Create new config
    newConfig = `customCommands:\n${LAZYGIT_CUSTOM_COMMAND}\n`;
  }

  ensureDirectoryExists(configPath);
  fs.writeFileSync(configPath, newConfig, "utf-8");

  if (isTTY) {
    p.log.success("Lazygit configuration updated!");
    p.log.info("Custom command added: Ctrl+A to generate AI commit messages");
    p.outro("Setup complete - restart lazygit to use the new command");
  } else {
    console.log("Lazygit configuration updated!");
    console.log("Custom command added: Ctrl+A to generate AI commit messages");
    console.log("Restart lazygit to use the new command");
  }
}
