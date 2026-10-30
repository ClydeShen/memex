import {
  type EnvironmentResource,
  err,
  ok,
  type ProviderResource,
  type Result,
  type StrategyResource,
} from "@memex/contracts";

// The services that the core hands to every component it creates.
export type ComponentContext = {
  readonly clock: { readonly now: () => string };
  readonly operationalLog: { readonly info: (message: string) => void };
};

// What a component's schema must offer. A Zod schema satisfies it, so the core does not import Zod.
export type ConfigSchema<Config> = {
  readonly safeParse: (
    input: unknown,
  ) =>
    | { readonly success: true; readonly data: Config }
    | { readonly success: false; readonly error: { readonly message: string } };
};

export type ComponentResource = EnvironmentResource | StrategyResource | ProviderResource;

export type RegistryEntry<Config, Instance> = {
  readonly kind: ComponentResource["kind"];
  readonly type: string;
  readonly configSchema: ConfigSchema<Config>;
  readonly capabilities: Readonly<Record<string, boolean>>;
  readonly create: (config: Config, ctx: ComponentContext) => Promise<Instance>;
};

export type RegisterError = {
  readonly kind: "duplicate-type";
  readonly type: string;
  readonly message: string;
};

type CreateError = {
  readonly kind: "invalid-config" | "create-failed";
  readonly message: string;
};

export type InstantiateError = {
  readonly kind: "unregistered-type" | "kind-mismatch" | CreateError["kind"];
  readonly type: string;
  readonly message: string;
};

export type Registry = {
  readonly register: <Config, Instance>(
    entry: RegistryEntry<Config, Instance>,
  ) => Result<undefined, RegisterError>;
  readonly instantiate: (
    resource: ComponentResource,
    ctx: ComponentContext,
  ) => Promise<Result<unknown, InstantiateError>>;
};

// An entry with its configuration type erased: the schema check and create are joined here,
// where both still know the type of the configuration.
type Registered = {
  readonly kind: ComponentResource["kind"];
  readonly create: (
    config: unknown,
    ctx: ComponentContext,
  ) => Promise<Result<unknown, CreateError>>;
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createRegistry = (): Registry => {
  const entries = new Map<string, Registered>();

  const register = <Config, Instance>(
    entry: RegistryEntry<Config, Instance>,
  ): Result<undefined, RegisterError> => {
    if (entries.has(entry.type)) {
      return err({
        kind: "duplicate-type",
        type: entry.type,
        message: `A component is already registered for the type "${entry.type}".`,
      });
    }
    entries.set(entry.type, {
      kind: entry.kind,
      create: async (config: unknown, ctx: ComponentContext) => {
        const parsed = entry.configSchema.safeParse(config);
        if (!parsed.success) return err({ kind: "invalid-config", message: parsed.error.message });
        try {
          return ok(await entry.create(parsed.data, ctx));
        } catch (error) {
          return err({ kind: "create-failed", message: messageOf(error) });
        }
      },
    });
    return ok(undefined);
  };

  const instantiate = async (
    resource: ComponentResource,
    ctx: ComponentContext,
  ): Promise<Result<unknown, InstantiateError>> => {
    const { type, config } = resource.spec;
    const registered = entries.get(type);
    if (registered === undefined) {
      return err({
        kind: "unregistered-type",
        type,
        message: `No component is registered for the type "${type}".`,
      });
    }
    if (registered.kind !== resource.kind) {
      return err({
        kind: "kind-mismatch",
        type,
        message: `The type "${type}" is registered for ${registered.kind}, not for ${resource.kind}.`,
      });
    }
    const created = await registered.create(config, ctx);
    if (!created.ok) return err({ ...created.error, type });
    return created;
  };

  return { register, instantiate };
};
