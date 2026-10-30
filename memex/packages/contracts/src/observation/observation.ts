import { z } from "zod";

// What happened: one raw perception from the World, or the result of one Action.
export const observationSchema = z.strictObject({
  id: z.string().min(1),
  source: z
    .string()
    .min(1)
    .describe("Where the Observation comes from, for example the Environment."),
  recordedAt: z.iso
    .datetime({ offset: true })
    .describe("When it was recorded. A simulated World uses its own clock."),
  payload: z.json(),
});

export type Observation = z.infer<typeof observationSchema>;
