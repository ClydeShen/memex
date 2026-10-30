import { z } from "zod";

// Resource configuration in the Kubernetes Resource Model format: apiVersion, kind, metadata, spec.
export const API_VERSION = "memex.dev/v0alpha1";

const RESOURCE_NAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const COMPONENT_TYPE = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

export const resourceNameSchema = z
  .string()
  .regex(RESOURCE_NAME)
  .describe(
    "A lowercase name of up to 63 letters, digits and hyphens. Other resources refer to it.",
  );

const metadataSchema = z.strictObject({
  name: resourceNameSchema,
});

const componentSpecSchema = z.strictObject({
  type: z
    .string()
    .regex(COMPONENT_TYPE)
    .describe(
      'The implementation, as "category.implementation", for example "environment.micro-world".',
    ),
  config: z
    .record(z.string(), z.json())
    .default({})
    .describe("The settings of the implementation, checked by the schema that its type registers."),
});

const experimentSpecSchema = z.strictObject({
  environment: resourceNameSchema.describe("The name of the Environment resource."),
  strategy: resourceNameSchema.describe("The name of the Strategy resource."),
  providers: z
    .array(resourceNameSchema)
    .default([])
    .describe("The names of the Provider resources that the Strategy may use."),
  seed: z.int().nonnegative().describe("The seed of the Environment and of every seeded Provider."),
  maxSteps: z.int().positive().describe("The cognitive loop stops after this many steps."),
});

const resourceBaseSchema = z.strictObject({
  apiVersion: z.literal(API_VERSION),
  metadata: metadataSchema,
});

export const experimentResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Experiment"),
  spec: experimentSpecSchema,
});

export const environmentResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Environment"),
  spec: componentSpecSchema,
});

export const strategyResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Strategy"),
  spec: componentSpecSchema,
});

export const providerResourceSchema = resourceBaseSchema.extend({
  kind: z.literal("Provider"),
  spec: componentSpecSchema,
});

export const resourceSchema = z.discriminatedUnion("kind", [
  experimentResourceSchema,
  environmentResourceSchema,
  strategyResourceSchema,
  providerResourceSchema,
]);

export type Resource = z.infer<typeof resourceSchema>;
export type ExperimentResource = z.infer<typeof experimentResourceSchema>;
export type EnvironmentResource = z.infer<typeof environmentResourceSchema>;
export type StrategyResource = z.infer<typeof strategyResourceSchema>;
export type ProviderResource = z.infer<typeof providerResourceSchema>;
