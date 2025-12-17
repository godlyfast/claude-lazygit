import { spawn } from "node:child_process";
import { SYSTEM_PROMPT, JSON_SCHEMA } from "./prompt";
import type { ClaudeCommitResponse } from "./types";

const MAX_DIFF_SIZE = 500 * 1024; // 500KB - prevents memory issues and ARG_MAX limits

interface ClaudeCliResponse {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  structured_output?: ClaudeCommitResponse;
}

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  spawnError?: string;
}

function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      // Capture spawn errors separately for better error messages
      const spawnError =
        err.code === "ENOENT"
          ? `Command '${command}' not found. Is Claude CLI installed?`
          : `Failed to spawn '${command}': ${err.message}`;

      resolve({
        stdout,
        stderr,
        exitCode: 1,
        spawnError,
      });
    });
  });
}

export async function generateCommitMessage(
  diff: string,
  verbose: boolean,
): Promise<string> {
  // Check diff size to prevent memory issues
  if (diff.length > MAX_DIFF_SIZE) {
    const sizeKB = Math.round(diff.length / 1024);
    const limitKB = Math.round(MAX_DIFF_SIZE / 1024);
    throw new Error(
      `Diff too large (${sizeKB}KB). Maximum size is ${limitKB}KB. ` +
        `Try staging fewer files or splitting into smaller commits.`,
    );
  }

  const userPrompt = `Generate a commit message for this diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;

  const args = [
    "-p",
    userPrompt,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(JSON_SCHEMA),
    "--system-prompt",
    SYSTEM_PROMPT,
  ];

  if (verbose) {
    console.error("Running Claude CLI...");
  }

  const { stdout, stderr, exitCode, spawnError } = await runCommand(
    "claude",
    args,
  );

  // Check for spawn errors first (command not found, etc.)
  if (spawnError) {
    throw new Error(spawnError);
  }

  if (exitCode !== 0) {
    throw new Error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
  }

  if (verbose) {
    console.error("Raw output:", stdout.slice(0, 500));
  }

  // Parse JSON response with error handling
  let response: ClaudeCliResponse;
  try {
    response = JSON.parse(stdout);
  } catch {
    const preview = stdout.slice(0, 200);
    throw new Error(
      `Failed to parse Claude CLI response. ` +
        `This may indicate a Claude CLI issue. Raw output: "${preview}"`,
    );
  }

  if (response.is_error) {
    throw new Error(`Claude CLI error: ${response.result}`);
  }

  // Validate message is present and non-empty
  const message = response.structured_output?.message?.trim();
  if (!message) {
    throw new Error("No valid commit message received from Claude CLI");
  }

  return message;
}
