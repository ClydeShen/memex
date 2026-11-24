import { z } from "zod";

const COMPONENT_TYPE = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

export const componentSpecSchema = z.strictObject({
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
