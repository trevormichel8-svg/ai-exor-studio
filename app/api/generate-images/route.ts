import { experimental_generateImage } from "ai";
import { NextResponse } from "next/server";
import { GenerateImagesSchema } from "@/lib/schemas/generate-images.schema";
import type { ImageModelV1 } from "ai";

export const runtime = "edge";

const MODEL_MAP: Record<
  "openai" | "fireworks" | "replicate" | "vertex",
  ImageModelV1> = {
  openai: "gpt-image-1",
  fireworks: "stable-diffusion-xl-1024-v1-0",
  replicate: "stability-ai/sdxl",
  vertex: "imagen-3.0-generate-001",
};


const ENV_MAP = {
  openai: ["OPENAI_API_KEY"],
  fireworks: ["FIREWORKS_API_KEY"],
  replicate: ["REPLICATE_API_TOKEN"],
  vertex: ["GOOGLE_APPLICATION_CREDENTIALS"],
} as const;

export async function POST(req: Request) {
  const parsed = GenerateImagesSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, provider, size, style } = parsed.data;

  for (const env of ENV_MAP[provider]) {
    if (!process.env[env]) {
      return NextResponse.json(
        { error: `Missing env var: ${env}` },
        { status: 500 }
      );
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const result = await experimental_generateImage({
      model: MODEL_MAP[ImageModelV1],
      prompt: `${prompt}, style: ${style}`,
      size,
      abortSignal: controller.signal,
    });

    if (!result?.image?.base64) {
      throw new Error("Image generation failed");
    }

    return NextResponse.json({
      image: result.image.base64,
      style,
      provider,
    });
  } finally {
    clearTimeout(timeout);
  }
}

