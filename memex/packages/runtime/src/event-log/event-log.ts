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
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

type EventId = Event["id"];

type Appended = {
  readonly result: Result<EventId, AppendError>;
  readonly lastId: EventId | undefined;
};

const loadLastId = async (path: string): Promise<EventId | undefined> => {
  const last = (await readLines(path)).at(-1);
  return last === undefined ? undefined : eventSchema.parse(JSON.parse(last)).id;
};

const appendOne = async (
  path: string,
  event: NewEvent,
  lastId: EventId | undefined,
): Promise<Appended> => {
  const candidate = {
    ...event,
    id: randomUUIDv7(),
    ...(lastId === undefined ? {} : { memexparent: lastId }),
  };
  const parsed = eventSchema.safeParse(candidate);
  if (!parsed.success) {
    return { result: err({ kind: "invalid-event", message: parsed.error.message }), lastId };
  }
  await appendFile(
    path,
    `${JSON.stringify(parsed.data)}
`,
  );
  return { result: ok(parsed.data.id), lastId: parsed.data.id };
};

export const createEventLog = (path: string): EventLog => {
  const chain: { tail: Promise<EventId | undefined> | undefined } = { tail: undefined };

  const append: EventLog["append"] = (event: NewEvent) => {
    const previous = chain.tail ?? loadLastId(path);
    const written = previous.then((lastId) => appendOne(path, event, lastId));
    chain.tail = written.then(
      (appended) => appended.lastId,
      () => loadLastId(path),
    );
    return written.then((appended) => appended.result);
  };

  const read: EventLog["read"] = async function* () {
    for (const line of await readLines(path)) {
      yield eventSchema.parse(JSON.parse(line));
    }
  };

  return { append, read };
};
