import { experimental_generateImage } from "ai";
import { NextResponse } from "next/server";
import { GenerateImagesSchema } from "@/lib/schemas/generate-images.schema";

export const runtime = "edge";

type Provider = "openai" | "fireworks" | "replicate" | "vertex";

/**
 * Resolve model using literal inference.
 * This avoids broken ImageModel / ImageModelV1 typings in the ai SDK.
 */
function resolveModel(provider: Provider) {
  switch (provider) {
    case "openai":
      return "gpt-image-1";
    case "fireworks":
      return "stable-diffusion-xl-1024-v1-0";
    case "replicate":
      return "stability-ai/sdxl";
    case "vertex":
      return "imagen-3.0-generate-001";
  }
}

const ENV_MAP: Record<Provider, readonly string[]> = {
  openai: ["OPENAI_API_KEY"],
  fireworks: ["FIREWORKS_API_KEY"],
  replicate: ["REPLICATE_API_TOKEN"],
  vertex: ["GOOGLE_APPLICATION_CREDENTIALS"],
};

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
      model: resolveModel(provider),
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
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return NextResponse.json(
        { error: "Image generation timed out" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: (err as Error).message ?? "Image generation failed" },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

        
