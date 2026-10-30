// Finds as-built pages whose covered files changed after the commit the page was checked at
// (`pnpm docs:stale`).

import { spawnSync } from "node:child_process";
import { asList, listPages, readPage } from "./pages.ts";

export type StalePage = { page: string; changes: string[] };

export const findStalePages = (root: string): StalePage[] =>
  listPages(root).flatMap((path) => {
    const { frontMatter } = readPage(root, path);
    const verifiedAt = asList(frontMatter["verified-at"])[0] ?? "";
    const covers = asList(frontMatter.covers).map((pattern) => `:(glob)${pattern}`);
    const result = spawnSync(
      "git",
      ["-c", "core.quotepath=false", "diff", "--name-only", `${verifiedAt}..HEAD`, "--", ...covers],
      { cwd: root, encoding: "utf8" },
    );
    if (result.status !== 0) {
      return [{ page: path, changes: [`git diff failed: ${result.stderr.trim()}`] }];
    }
    const changes = result.stdout.split("\n").filter((line) => line !== "");
    return changes.length === 0 ? [] : [{ page: path, changes }];
  });
