import { ProviderKey } from "./provider-config";
import { ArtStyle } from "./art-styles";

export interface GenerateImageRequest {
  prompt: string;
  style?: ArtStyle; // ✅ added (optional + type-safe)
  provider: ProviderKey;
  modelId: string;
}

export interface GenerateImageResponse {
  image?: string;
  error?: string;
}
