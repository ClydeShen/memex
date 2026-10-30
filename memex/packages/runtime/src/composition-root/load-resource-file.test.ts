import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { loadResourceFile } from "./load-resource-file.ts";

let dir = "";

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "resource-file-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true });
});

const writeResource = async (text: string): Promise<string> => {
  const path = join(dir, "resource.yaml");
  await writeFile(path, text);
  return path;
};

const ENVIRONMENT = `
apiVersion: memex.dev/v0alpha1
kind: Environment
metadata:
  name: one-room
spec:
  type: environment.micro-world
  config:
    rooms: 1
`;

test("reads a resource from a YAML file", async () => {
  const result = await loadResourceFile(await writeResource(ENVIRONMENT));
  expect(result).toEqual({
    ok: true,
    value: {
      apiVersion: "memex.dev/v0alpha1",
      kind: "Environment",
      metadata: { name: "one-room" },
      spec: { type: "environment.micro-world", config: { rooms: 1 } },
    },
  });
});

test("reports a file that cannot be read", async () => {
  const result = await loadResourceFile(join(dir, "missing.yaml"));
  expect(result.ok === false && result.error.kind).toBe("unreadable");
});

test("reports text that is not YAML", async () => {
  const result = await loadResourceFile(await writeResource("spec: [unclosed"));
  expect(result.ok === false && result.error.kind).toBe("invalid-yaml");
});

test("rejects a custom tag instead of acting on it", async () => {
  const tagged = ENVIRONMENT.replace("rooms: 1", "rooms: !!js/function 'function () {}'");
  const result = await loadResourceFile(await writeResource(tagged));
  expect(result.ok === false && result.error.kind).toBe("invalid-yaml");
});

test("rejects a file with more than one document", async () => {
  const result = await loadResourceFile(await writeResource(`${ENVIRONMENT}---${ENVIRONMENT}`));
  expect(result.ok === false && result.error.kind).toBe("invalid-yaml");
});

test("rejects data that is not a resource", async () => {
  const result = await loadResourceFile(await writeResource("kind: Runtime\n"));
  expect(result.ok === false && result.error.kind).toBe("invalid-resource");
});
