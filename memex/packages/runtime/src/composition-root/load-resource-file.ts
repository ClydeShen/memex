import { readFile } from "node:fs/promises";
import { err, ok, type Resource, type Result, resourceSchema } from "@memex/contracts";
import { parseDocument } from "yaml";

export type LoadError = {
  readonly kind: "unreadable" | "invalid-yaml" | "invalid-resource";
  readonly message: string;
};

// The core schema reads plain data only. A tag it does not know becomes a warning here, and
// the file is rejected, so no tag can build an object or run code.
const parseYamlAsData = (text: string): Result<unknown, LoadError> => {
  const document = parseDocument(text, { schema: "core" });
  const problem = [...document.errors, ...document.warnings][0];
  if (problem !== undefined) return err({ kind: "invalid-yaml", message: problem.message });
  return ok(document.toJS());
};

export const loadResourceFile = async (path: string): Promise<Result<Resource, LoadError>> => {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    return err({
      kind: "unreadable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
  const data = parseYamlAsData(text);
  if (!data.ok) return data;
  const parsed = resourceSchema.safeParse(data.value);
  if (!parsed.success) return err({ kind: "invalid-resource", message: parsed.error.message });
  return ok(parsed.data);
};
