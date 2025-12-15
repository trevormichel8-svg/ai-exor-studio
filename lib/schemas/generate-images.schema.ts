import { z } from "zod";
import { ART_STYLES } from "@/lib/art-styles";
 

export const GenerateImagesSchema = z.object({
  prompt: z.string().min(1),
  provider: z.enum(["openai", "fireworks", "replicate", "vertex"]),
  size: z.string().default("1024x1024"),
  z.enum(ART_STYLES).default("Modern Flat"),
});

export type GenerateImagesInput = z.infer<typeof GenerateImagesSchema>;
  
