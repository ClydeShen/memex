import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AS_BUILT } from "./pages.ts";

const GLOSSARY = "factory/design/GLOSSARY.md";
const NOT_CHECKED = /^factory\/as-built\/(?:TEMPLATE\.md|generated\/)/;

export type AvoidedWord = { word: string; term: string };

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
  return words.filter(({ word }) => !terms.has(word.toLowerCase()));
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findAvoidedWords = (root: string): string[] => {
  if (!existsSync(join(root, GLOSSARY)) || !existsSync(join(root, AS_BUILT))) return [];
  const words = parseAvoidedWords(readFileSync(join(root, GLOSSARY), "utf8")).map((avoided) => ({
    ...avoided,
    pattern: new RegExp(`\\b${escapeRegExp(avoided.word)}\\b`, "i"),
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
          .filter(({ pattern }) => pattern.test(text.replace(/`[^`]*`|\]\([^)]*\)/g, "")))
          .map(
            ({ word, term }) =>
              `${file}:${index + 1}: "${word}" (the glossary says to use "${term}")`,
          ),
      ),
  );
};
