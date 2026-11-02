import { z } from "zod";

/**
 * One puzzle stage of the Escape.exe chain (puzzles/escape-exe.json).
 * Stages are played strictly in file order. The answers never leave the
 * database: teams only ever see the clue of the stage they are working on.
 */
export const StageSchema = z.object({
  code: z.string().regex(/^S\d+$/, "code must look like S1, S2 …"),
  title: z.string().min(1),
  /** digital = on the PC, physical = something in the room, hybrid = both */
  kind: z.enum(["digital", "physical", "hybrid"]),
  /** small label above the title, e.g. "TERMINAL 01 · BOOT" */
  zone: z.string().min(1),
  /** the short story shown above the clue */
  story: z.string().min(1),
  clue: z.object({
    /** file-name style label of the exhibit panel */
    label: z.string().min(1),
    text: z.string().min(1),
    /** monospace (terminal) or normal text */
    mono: z.boolean().default(true),
    notes: z.array(z.string().min(1)).default([]),
    /** show the webcam QR scanner */
    scanner: z.boolean().default(false),
    /** show the collected key fragments as part of the clue */
    stack: z.boolean().default(false),
  }),
  prompt: z.string().min(1),
  input: z
    .object({
      /** code = numeric lock with `length` digit boxes, text = one text field */
      mode: z.enum(["text", "code"]).default("text"),
      length: z.number().int().min(1).max(12).optional(),
      placeholder: z.string().optional(),
    })
    .default({ mode: "text" }),
  /** accepted answers (compared after normalisation) */
  answers: z.array(z.string().min(1)).min(1),
  /** 1–3 hints, gentlest first. Each one used adds the time penalty. */
  hints: z.array(z.string().min(1)).min(1).max(3),
  /** one letter pushed on the key stack when the stage is solved ("" = none) */
  fragment: z.string().max(1).default(""),
  /** WARDEN's reaction after the stage is solved */
  solved_message: z.string().min(1),
});

export const EscapeFileSchema = z
  .object({
    title: z.string().min(1).optional(),
    stages: z.array(StageSchema).min(3).max(30),
  })
  .superRefine((f, ctx) => {
    f.stages.forEach((s, i) => {
      if (s.code !== `S${i + 1}`) ctx.addIssue({ code: "custom", message: `stage #${i + 1} must be coded S${i + 1}, found ${s.code}` });
      if (s.input.mode === "code" && !s.input.length) ctx.addIssue({ code: "custom", message: `${s.code}: a "code" input needs a length` });
    });
  });

export type EscapeFile = z.infer<typeof EscapeFileSchema>;
export type EscapeStageFile = z.infer<typeof StageSchema>;
