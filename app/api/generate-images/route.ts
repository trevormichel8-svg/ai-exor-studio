import { NextRequest, NextResponse } from "next/server";
import { ImageModel, experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import { replicate } from "@ai-sdk/replicate";
import { vertex } from "@ai-sdk/google-vertex/edge";
import { ProviderKey } from "@/lib/provider-config";
import { GenerateImageRequest } from "@/lib/api-types";

const TIMEOUT_MILLIS = 55 * 1000;
const DEFAULT_IMAGE_SIZE = "1024x1024";
const DEFAULT_ASPECT_RATIO = "1:1";

interface ProviderConfig {
  createImageModel: (modelId: string) => ImageModel;
  dimensionFormat: "size" | "aspectRatio";
}

const providerConfig: Record<ProviderKey, ProviderConfig> = {
  openai: {
    createImageModel: openai.image,
    dimensionFormat: "size",
  },
  fireworks: {
    createImageModel: fireworks.image,
    dimensionFormat: "aspectRatio",
  },
  replicate: {
    createImageModel: replicate.image,
    dimensionFormat: "size",
  },
  vertex: {
    createImageModel: vertex.image,
    dimensionFormat: "aspectRatio",
  },
};

const withTimeout = <T>(promise: Promise<T>, timeoutMillis: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis)
    ),
  ]);

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  const { prompt, provider, modelId } =
    (await req.json()) as GenerateImageRequest;

  try {
    if (!prompt || !provider || !providerConfig[provider]) {
      const error = "Invalid request parameters";
      console.error(`${error} [requestId=${requestId}]`);
      return NextResponse.json({ error }, { status: 400 });
    }

    const config = providerConfig[provider];

    // ✅ CRITICAL FIX:
    // OpenAI image generation ONLY supports gpt-image-1
    const resolvedModelId =
      provider === "openai" ? "gpt-image-1" : modelId;

    if (!resolvedModelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    const startstamp = performance.now();

    const generatePromise = generateImage({
      model: config.createImageModel(resolvedModelId),
      prompt,
      ...(config.dimensionFormat === "size"
        ? { size: DEFAULT_IMAGE_SIZE }
        : { aspectRatio: DEFAULT_ASPECT_RATIO }),
      ...(provider !== "openai" && {
        seed: Math.floor(Math.random() * 1_000_000),
      }),
      providerOptions: {
        vertex: { addWatermark: false },
      },
    }).then(({ image, warnings }) => {
      if (warnings?.length) {
        console.warn(
          `Warnings [requestId=${requestId}, provider=${provider}, model=${resolvedModelId}]:`,
          warnings
        );
      }

      console.log(
        `Image generated [requestId=${requestId}, provider=${provider}, model=${resolvedModelId}, elapsed=${(
          (performance.now() - startstamp) /
          1000
        ).toFixed(1)}s]`
      );

      return {
        provider,
        image: image.base64,
      };
    });

    const result = await withTimeout(generatePromise, TIMEOUT_MILLIS);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(
      `❌ Image generation failed [requestId=${requestId}, provider=${provider}]:`,
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate image",
      },
      { status: 500 }
    );
  }
}
