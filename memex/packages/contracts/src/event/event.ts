import { z } from "zod";

// One line of the Event Log: a CloudEvents 1.0 event in the structured JSON format.
// CloudEvents allows only lowercase letters and digits in extension attribute names.
export const eventSchema = z.strictObject({
  specversion: z.literal("1.0"),
  id: z.uuidv7(),
  source: z.string().min(1).describe("The component that produced the event."),
  type: z
    .string()
    .regex(/^memex(?:\.[a-z][a-z0-9-]*){2,}$/)
    .describe('"memex.<domain>.<action>", for example "memex.action.executed".'),
  time: z.iso.datetime({ offset: true }).describe("A simulated World uses its own clock."),
  datacontenttype: z.literal("application/json"),
  data: z.json(),
  memexactor: z.string().min(1).describe("Who caused the event, as the core recorded it."),
  memexinstance: z.string().min(1).describe("The Instance that wrote the event."),
  memexparent: z
    .uuidv7()
    .optional()
    .describe("The id of the previous event. The first event has none."),
});

export type Event = z.infer<typeof eventSchema>;
