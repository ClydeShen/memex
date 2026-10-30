import { z } from "zod";

export const goalSchema = z.strictObject({
  id: z.string().min(1),
  description: z.string().min(1).describe("The target state of the World, in words."),
  params: z
    .record(z.string(), z.json())
    .describe("The parameters of the Goal, for example a target room."),
});

export type Goal = z.infer<typeof goalSchema>;
