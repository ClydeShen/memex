// Finds words in the as-built pages that the glossary says to avoid. A word can be right in its
// context, so this only reports and never fails a check.

import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AS_BUILT } from "./pages.ts";

const GLOSSARY = "factory/design/GLOSSARY.md";
const NOT_CHECKED = /^factory\/as-built\/(?:TEMPLATE\.md|generated\/)/;

export type AvoidedWord = { word: string; term: string };

// `**Term**:` starts an entry; `_Avoid_: a, b (only in this sense), c` lists its words.
export const parseAvoidedWords = (glossary: string): AvoidedWord[] => {
  const words: AvoidedWord[] = [];
  const terms = new Set<string>();
  let term: string | null = null;
  for (const line of glossary.split("\n")) {
    const entry = /^\*\*(.+?)\*\*:/.exec(line);
    const avoid = /^_Avoid_:\s*(.*)$/.exec(line);
    if (entry?.[1] !== undefined) {
      term = entry[1];
      terms.add(term.toLowerCase());
    } else if (avoid?.[1] !== undefined && term !== null) {
      const listed = avoid[1].replace(/\([^)]*\)/g, "").split(",");
      for (const word of listed.map((text) => text.trim()).filter((text) => text !== "")) {
        words.push({ word, term });
      }
    }
  }
  // A word that is itself a term, such as "Ground Truth", is used in its own sense.
  return words.filter(({ word }) => !terms.has(word.toLowerCase()));
};

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findAvoidedWords = (root: string): string[] => {
  if (!existsSync(join(root, GLOSSARY)) || !existsSync(join(root, AS_BUILT))) return [];
  const words = parseAvoidedWords(readFileSync(join(root, GLOSSARY), "utf8")).map((avoided) => ({
    ...avoided,
    pattern: new RegExp(`\\b${escape(avoided.word)}\\b`, "i"),
  }));
  const files = globSync("**/*.md", { cwd: join(root, AS_BUILT) })
    .map((file) => `${AS_BUILT}/${file.replaceAll("\\", "/")}`)
    .filter((file) => !NOT_CHECKED.test(file))
    .sort();
  return files.flatMap((file) =>
    readFileSync(join(root, file), "utf8")
      .split("\n")
      .flatMap((text, index) =>
        words
          // Code in backticks and link targets name things; only the prose is checked.
          .filter(({ pattern }) => pattern.test(text.replace(/`[^`]*`|\]\([^)]*\)/g, "")))
          .map(
            ({ word, term }) =>
              `${file}:${index + 1}: "${word}" (the glossary says to use "${term}")`,
          ),
      ),
  );
};
