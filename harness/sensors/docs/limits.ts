import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_LIMIT = 300;

const FILE_LIMITS: Record<string, number> = {
  "AGENTS.md": 60,
  "factory/design/HANDOFF.md": 100,
};

const DIRECTORIES: { path: string; limit: number | null }[] = [
  { path: "factory/design", limit: DEFAULT_LIMIT },
  { path: "factory/as-built", limit: DEFAULT_LIMIT },
  { path: "factory/records", limit: null },
  { path: "harness/rules", limit: DEFAULT_LIMIT },
  { path: "harness/agents", limit: DEFAULT_LIMIT },
];
const SINGLE_FILES = ["harness/README.md"];

const ROOTS = ["factory", "harness"];

const lineCount = (text: string): number =>
  text.replaceAll("\r\n", "\n").replace(/\n$/, "").split("\n").length;

const markdownFiles = (root: string): string[] =>
  [
    ...ROOTS.flatMap((directory) =>
      globSync(`${directory}/**/*.md`, { cwd: root }).map((file) => file.replaceAll("\\", "/")),
    ),
    ...Object.keys(FILE_LIMITS).filter((file) => globSync(file, { cwd: root }).length > 0),
  ]
    .filter((file) => !file.includes("node_modules/"))
    .sort();

const limitOf = (file: string): number | null | undefined => {
  const own = FILE_LIMITS[file];
  if (own !== undefined) return own;
  if (SINGLE_FILES.includes(file)) return DEFAULT_LIMIT;
  return DIRECTORIES.find(({ path }) => file.startsWith(`${path}/`))?.limit;
};

export const checkLimits = (root: string): string[] =>
  [...new Set(markdownFiles(root))].flatMap((file) => {
    const limit = limitOf(file);
    if (limit === undefined) {
      const listed = [...DIRECTORIES.map(({ path }) => path), ...SINGLE_FILES].join(", ");
      return [`${file}: not in a directory that the docs check lists (${listed})`];
    }
    if (limit === null) return [];
    const lines = lineCount(readFileSync(join(root, file), "utf8"));
    return lines > limit ? [`${file}: ${lines} lines, the limit is ${limit}`] : [];
  });
