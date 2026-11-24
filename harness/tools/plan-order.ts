#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { formatReport, hasProblems, type Issue, planOrder } from "./plan-order-report.ts";

type GitHubIssue = {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string } | string>;
  body?: string | null;
};

const MAX_OUTPUT = 64 * 1024 * 1024;

const getJson = (path: string, { paginate }: { paginate: boolean }): unknown => {
  const pages = paginate ? ["--paginate", "--slurp"] : [];
  const output = execFileSync("gh", ["api", "--method", "GET", ...pages, path], {
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT,
  });
  return JSON.parse(output);
};

const getAllPages = (path: string): GitHubIssue[] =>
  (getJson(path, { paginate: true }) as GitHubIssue[][]).flat();

const toIssue = (issue: GitHubIssue): Issue => ({
  number: issue.number,
  title: issue.title,
  state: issue.state === "closed" ? "closed" : "open",
  labels: issue.labels.map((label) => (typeof label === "string" ? label : label.name)),
});

const run = (epic: number): number => {
  const epicIssue = getJson(`repos/{owner}/{repo}/issues/${epic}`, {
    paginate: false,
  }) as GitHubIssue;
  const subIssues = getAllPages(`repos/{owner}/{repo}/issues/${epic}/sub_issues`).map(toIssue);
  const blockedBy = Object.fromEntries(
    subIssues.map((issue) => [
      issue.number,
      getAllPages(`repos/{owner}/{repo}/issues/${issue.number}/dependencies/blocked_by`).map(
        toIssue,
      ),
    ]),
  );
  const report = planOrder({ epic, body: epicIssue.body ?? "", subIssues, blockedBy });
  process.stdout.write(formatReport(report));
  return hasProblems(report) ? 1 : 0;
};

const epic = Number(process.argv[2]);
if (!Number.isInteger(epic) || epic <= 0) {
  process.stderr.write("usage: pnpm plan:order <epic number>\n");
  process.exitCode = 2;
} else {
  try {
    process.exitCode = run(epic);
  } catch (error) {
    process.stderr.write(`plan:order: a request to GitHub failed: ${String(error)}\n`);
    process.exitCode = 2;
  }
}
