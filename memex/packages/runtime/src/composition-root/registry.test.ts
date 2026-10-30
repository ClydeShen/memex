import type { EnvironmentResource, ProviderResource } from "@memex/contracts";
import { API_VERSION } from "@memex/contracts";
import { expect, test } from "vitest";
import { type ComponentContext, type ConfigSchema, createRegistry } from "./registry.ts";

type RoomsConfig = { readonly rooms: number };

const invalid = { success: false, error: { message: "rooms must be a number" } } as const;

const roomsSchema: ConfigSchema<RoomsConfig> = {
  safeParse: (input: unknown) => {
    if (typeof input !== "object" || input === null) return invalid;
    if (!("rooms" in input) || typeof input.rooms !== "number") return invalid;
    return { success: true, data: { rooms: input.rooms } };
  },
};

const context: ComponentContext = {
  clock: { now: () => "2026-01-01T00:00:00Z" },
  operationalLog: { info: () => {} },
};

const environment = (type: string, config: Record<string, unknown>): EnvironmentResource => ({
  apiVersion: API_VERSION,
  kind: "Environment",
  metadata: { name: "one-room" },
  spec: { type, config: config as EnvironmentResource["spec"]["config"] },
});

const registerWorld = (registry: ReturnType<typeof createRegistry>): void => {
  registry.register({
    kind: "Environment",
    type: "environment.micro-world",
    configSchema: roomsSchema,
    capabilities: {},
    create: async (config: RoomsConfig) => ({ roomCount: config.rooms }),
  });
};

test("names the type that is not registered", async () => {
  const registry = createRegistry();
  const result = await registry.instantiate(environment("environment.unknown", {}), context);
  expect(result).toEqual({
    ok: false,
    error: {
      kind: "unregistered-type",
      type: "environment.unknown",
      message: 'No component is registered for the type "environment.unknown".',
    },
  });
});

test("creates the component with a configuration that its own schema has checked", async () => {
  const registry = createRegistry();
  registerWorld(registry);
  const result = await registry.instantiate(
    environment("environment.micro-world", { rooms: 3 }),
    context,
  );
  expect(result).toEqual({ ok: true, value: { roomCount: 3 } });
});

test("does not create the component when its configuration is invalid", async () => {
  const registry = createRegistry();
  let created = false;
  registry.register({
    kind: "Environment",
    type: "environment.micro-world",
    configSchema: roomsSchema,
    capabilities: {},
    create: async () => {
      created = true;
      return {};
    },
  });
  const result = await registry.instantiate(
    environment("environment.micro-world", { rooms: "many" }),
    context,
  );
  expect(result.ok === false && result.error).toMatchObject({
    kind: "invalid-config",
    type: "environment.micro-world",
  });
  expect(created).toBe(false);
});

test("hands the core services to the component", async () => {
  const registry = createRegistry();
  registry.register({
    kind: "Environment",
    type: "environment.micro-world",
    configSchema: roomsSchema,
    capabilities: {},
    create: async (_config: RoomsConfig, ctx: ComponentContext) => ({ createdAt: ctx.clock.now() }),
  });
  const result = await registry.instantiate(
    environment("environment.micro-world", { rooms: 1 }),
    context,
  );
  expect(result).toEqual({ ok: true, value: { createdAt: "2026-01-01T00:00:00Z" } });
});

test("rejects a type that is registered for another kind", async () => {
  const registry = createRegistry();
  registerWorld(registry);
  const provider: ProviderResource = {
    apiVersion: API_VERSION,
    kind: "Provider",
    metadata: { name: "world-as-provider" },
    spec: { type: "environment.micro-world", config: { rooms: 1 } },
  };
  const result = await registry.instantiate(provider, context);
  expect(result.ok === false && result.error).toMatchObject({
    kind: "kind-mismatch",
    type: "environment.micro-world",
  });
});

test("returns a failure of create as an error", async () => {
  const registry = createRegistry();
  registry.register({
    kind: "Environment",
    type: "environment.micro-world",
    configSchema: roomsSchema,
    capabilities: {},
    create: async () => {
      throw new Error("no room");
    },
  });
  const result = await registry.instantiate(
    environment("environment.micro-world", { rooms: 1 }),
    context,
  );
  expect(result.ok === false && result.error).toMatchObject({
    kind: "create-failed",
    type: "environment.micro-world",
  });
});

test("refuses to register one type twice", () => {
  const registry = createRegistry();
  registerWorld(registry);
  const second = registry.register({
    kind: "Environment",
    type: "environment.micro-world",
    configSchema: roomsSchema,
    capabilities: {},
    create: async () => ({}),
  });
  expect(second.ok === false && second.error.kind).toBe("duplicate-type");
});
