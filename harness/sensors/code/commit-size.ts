const MAX_CHANGED_LINES = 400;

const EXCLUDED = [/^pnpm-lock\.yaml$/, /^factory\/as-built\/generated\//];

export const changedLines = (numstat: string): number =>
  numstat
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => line.split("\t"))
    .filter(([, , file]) => file !== undefined && !EXCLUDED.some((pattern) => pattern.test(file)))
    .reduce((total, [added, deleted]) => total + (Number(added) || 0) + (Number(deleted) || 0), 0);

export const checkCommitSize = (numstat: string): string[] => {
  const lines = changedLines(numstat);
  return lines > MAX_CHANGED_LINES
    ? [
        `This commit changes ${lines} lines, the limit is ${MAX_CHANGED_LINES} (not counting pnpm-lock.yaml and generated files). Split the change into smaller commits that each work on their own, for example with git add -p.`,
      ]
    : [];
};
