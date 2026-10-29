// PostToolUse hook for Edit and Write: lints the edited TypeScript file at once, so the agent
// sees the rule that failed in the same turn instead of at commit time.
// Exit code 2 sends stderr back to the agent.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

type HookInput = {
  cwd: string;
  // biome-ignore lint/style/useNamingConvention: field names are set by Claude Code.
  tool_input?: { file_path?: string };
};

const BLOCK = 2;

const input = JSON.parse(readFileSync(0, "utf8")) as HookInput;
// Windows paths arrive with backslashes; Biome and the checks below expect forward slashes.
const file = input.tool_input?.file_path?.replaceAll("\\", "/");
// Biome only checks files inside the project; it fails on a path outside it.
const path = file === undefined ? "" : relative(input.cwd, file);
const inProject = path !== "" && !path.startsWith("..") && !isAbsolute(path);

if (file?.endsWith(".ts") && inProject) {
  const biome = join(input.cwd, "node_modules/@biomejs/biome/bin/biome");
  const result = spawnSync(process.execPath, [biome, "check", "--no-errors-on-unmatched", file], {
    cwd: input.cwd,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(`biome check failed for ${file}:\n${result.stdout}${result.stderr}`);
    process.exit(BLOCK);
  }
}
