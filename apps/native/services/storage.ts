import type { ImagePickerAsset } from "expo-image-picker";

import { supabase } from "@/utils/supabase";

function buildFilePath(prefix: string, asset: ImagePickerAsset) {
  const extension =
    asset.fileName?.split(".").pop() ??
    (asset.type === "video" ? "mp4" : "jpg");
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
}

export async function uploadPickedAsset(
  bucket: "message-media" | "post-media",
  asset: ImagePickerAsset,
) {
  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const filePath = buildFilePath(bucket, asset);
  const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
    contentType: asset.mimeType ?? undefined,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
