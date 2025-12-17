export interface CommitSuggestion {
  message: string;
  explanation?: string;
}

export interface ClaudeCommitResponse {
  commits: CommitSuggestion[];
}

export interface RunOptions {
  count: number;
  verbose: boolean;
}
