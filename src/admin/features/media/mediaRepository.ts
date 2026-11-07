import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database, MediaAssetRow } from "@/lib/supabase/database.types";
import type { MediaReference } from "@/features/portfolio-content/schema";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected image could not be decoded."));
    };
    image.src = url;
  });

const optimizeImage = async (file: File) => {
  if (!ACCEPTED_TYPES.has(file.type)) throw new Error("Use a JPEG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Images must be smaller than 12 MB.");
  const image = await loadImage(file);
  const scale = Math.min(1, 1920 / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob) throw new Error("The browser could not optimize this image.");
  return { blob, width, height };
};

export const uploadProjectImage = async (
  file: File,
  kind: Database["public"]["Enums"]["portfolio_media_kind"],
  alt: string,
  caption = ""
): Promise<MediaReference> => {
  if (alt.trim().length < 3) throw new Error("Write useful alt text before uploading.");
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error("Your admin session expired.");
  const optimized = await optimizeImage(file);
  const assetId = crypto.randomUUID();
  const path = `${auth.user.id}/${assetId}.webp`;
  const { error: storageError } = await client.storage
    .from("portfolio-media")
    .upload(path, optimized.blob, { contentType: "image/webp", upsert: false });
  if (storageError) throw new Error(storageError.message);
  const { error: rowError } = await client.from("media_assets").insert({
    id: assetId,
    storage_path: path,
    kind,
    mime_type: "image/webp",
    byte_size: optimized.blob.size,
    width: optimized.width,
    height: optimized.height,
    alt_text: alt.trim(),
    caption: caption.trim(),
    is_published: false,
    created_by: auth.user.id,
  });
  if (rowError) {
    await client.storage.from("portfolio-media").remove([path]);
    throw new Error(rowError.message);
  }
  return { assetId, path, alt: alt.trim(), caption: caption.trim() };
};

export const getMediaPreviewUrl = async (path: string) => {
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;
  const { data, error } = await getSupabaseClient()!.storage
    .from("portfolio-media")
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

export type { MediaAssetRow };
