import simpleGit from "simple-git";

const git = simpleGit();

export async function getStagedDiff(): Promise<string> {
  const diff = await git.diff(["--cached"]);
  return diff;
}

export async function isGitRepo(): Promise<boolean> {
  return git.checkIsRepo();
}
