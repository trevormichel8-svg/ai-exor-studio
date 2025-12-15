import { z } from "zod";
import { ART_STYLES, DEFAULT_STYLE } from "@/lib/art-styles";

export const GenerateImagesSchema = z.object({
  prompt: z.string().min(1),
  provider: z.enum(["openai", "fireworks", "replicate", "vertex"]),
  size: z.string().default("1024x1024"),
  style: z.enum(ART_STYLES).default(DEFAULT_STYLE),
});

export type GenerateImagesInput = z.infer<typeof GenerateImagesSchema>;
  
