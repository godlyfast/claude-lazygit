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
      stdio: ["pipe", "pipe", "pipe"],
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

export async function generateCommitMessages(
  diff: string,
  count: number,
  verbose: boolean
): Promise<ClaudeCommitResponse> {
  const userPrompt = `Generate ${count} commit message suggestions for this diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;

  const schemaWithCount = {
    ...JSON_SCHEMA,
    properties: {
      ...JSON_SCHEMA.properties,
      commits: {
        ...JSON_SCHEMA.properties.commits,
        minItems: count,
        maxItems: count,
      },
    },
  };

  const args = [
    "-p",
    userPrompt,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(schemaWithCount),
    "--system-prompt",
    SYSTEM_PROMPT,
  ];

  if (verbose) {
    console.error("Running: claude", args.slice(0, 3).join(" ").slice(0, 100) + "...");
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

  if (response.structured_output) {
    return response.structured_output;
  }

  throw new Error("No structured output received from Claude CLI");
}
