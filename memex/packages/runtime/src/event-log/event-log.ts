import { randomUUIDv7 } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import { type Event, err, eventSchema, ok, type Result } from "@memex/contracts";

export type NewEvent = Omit<Event, "id" | "memexparent">;

export type AppendError = { readonly kind: "invalid-event"; readonly message: string };

export type EventLog = {
  readonly append: (event: NewEvent) => Promise<Result<Event["id"], AppendError>>;
  readonly read: () => AsyncIterable<Event>;
};

const readLines = async (path: string): Promise<readonly string[]> => {
  try {
    const text = await readFile(path, "utf8");
    return text.split("\n").filter((line) => line !== "");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
};

export const createEventLog = (path: string): EventLog => {
  // Appends are chained so that each event names the one written just before it.
  let lastId: Event["id"] | undefined;
  let loaded = false;
  let queue: Promise<unknown> = Promise.resolve();

  const loadLastId = async (): Promise<void> => {
    if (loaded) return;
    const lines = await readLines(path);
    const last = lines.at(-1);
    lastId = last === undefined ? undefined : eventSchema.parse(JSON.parse(last)).id;
    loaded = true;
  };

  const appendOne = async (event: NewEvent): Promise<Result<Event["id"], AppendError>> => {
    await loadLastId();
    const candidate = {
      ...event,
      id: randomUUIDv7(),
      ...(lastId === undefined ? {} : { memexparent: lastId }),
    };
    const parsed = eventSchema.safeParse(candidate);
    if (!parsed.success) return err({ kind: "invalid-event", message: parsed.error.message });
    await appendFile(path, `${JSON.stringify(parsed.data)}\n`);
    lastId = parsed.data.id;
    return ok(parsed.data.id);
  };

  const append: EventLog["append"] = (event: NewEvent) => {
    const result = queue.then(() => appendOne(event));
    queue = result.catch(() => undefined);
    return result;
  };

  const read: EventLog["read"] = async function* () {
    for (const line of await readLines(path)) yield eventSchema.parse(JSON.parse(line));
  };

  return { append, read };
};
