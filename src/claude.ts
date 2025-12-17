import { spawn } from "node:child_process";
import { SYSTEM_PROMPT, JSON_SCHEMA } from "./prompt";
import type { ClaudeCommitResponse } from "./types";

interface ClaudeCliResponse {
  type: string;
  subtype: string;
  is_error: boolean;
  result: string;
  structured_output?: ClaudeCommitResponse;
}

function runCommand(
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
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

    proc.on("error", (err) => {
      stderr += err.message;
      resolve({
        stdout,
        stderr,
        exitCode: 1,
      });
    });
  });
}

export async function generateCommitMessage(
  diff: string,
  verbose: boolean
): Promise<string> {
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

  const { stdout, stderr, exitCode } = await runCommand("claude", args);

  if (exitCode !== 0) {
    throw new Error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
  }

  if (verbose) {
    console.error("Raw output:", stdout.slice(0, 500));
  }

  const response: ClaudeCliResponse = JSON.parse(stdout);

  if (response.is_error) {
    throw new Error(`Claude CLI error: ${response.result}`);
  }

  if (response.structured_output?.message) {
    return response.structured_output.message;
  }

  throw new Error("No commit message received from Claude CLI");
}
