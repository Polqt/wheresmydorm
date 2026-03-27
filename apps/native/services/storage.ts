import * as FileSystem from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";

import { supabase } from "@/utils/supabase";

type StorageBucket =
  | "avatars"
  | "listing-photos"
  | "message-media"
  | "post-media";

async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be signed in before uploading files.");
  }

  return user.id;
}

function buildFilePath(userId: string, asset: ImagePickerAsset) {
  const extension =
    asset.fileName?.split(".").pop() ??
    (asset.type === "video" ? "mp4" : "jpg");
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
}

export async function uploadFileUri({
  bucket,
  contentType,
  filePath,
  upsert = false,
  uri,
}: {
  bucket: StorageBucket;
  contentType?: string;
  filePath: string;
  upsert?: boolean;
  uri: string;
}) {
  const file = new FileSystem.File(uri);
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(filePath, fileBytes, {
    contentType,
    upsert,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadPickedAsset(
  bucket: "listing-photos" | "message-media" | "post-media",
  asset: ImagePickerAsset,
) {
  const userId = await getCurrentUserId();
  const filePath = buildFilePath(userId, asset);
  return uploadFileUri({
    bucket,
    contentType: asset.mimeType ?? undefined,
    filePath,
    uri: asset.uri,
  });
}
