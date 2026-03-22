import type { User } from "@supabase/supabase-js";

import type { RoleOption } from "@/types/auth";
import { supabase } from "@/utils/supabase";

export type NativeProfileRole = "finder" | "lister" | "admin" | null;

export type NativeProfile = {
  avatarUrl: string | null;
  displayName: string;
  id: string;
  role: NativeProfileRole;
};

type ProfileRow = {
  avatar_url: string | null;
  display_name: string;
  id: string;
  role: NativeProfileRole;
};

function getProfileDefaults(user: User) {
  const fallbackName = user.email?.split("@")[0] ?? "WheresMyDorm user";
  const displayName =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    fallbackName;
  const avatarUrl =
    (user.user_metadata.avatar_url as string | undefined) ?? null;

  return {
    avatar_url: avatarUrl,
    display_name: displayName,
    id: user.id,
  };
}

function normalizeProfile(row: ProfileRow): NativeProfile {
  return {
    avatarUrl: row.avatar_url,
    displayName: row.display_name,
    id: row.id,
    role: row.role,
  };
}

export async function ensureCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(getProfileDefaults(user), {
      onConflict: "id",
    })
    .select("id, role, display_name, avatar_url")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return normalizeProfile(data);
}

export async function getOrCreateCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  if (data) {
    return normalizeProfile(data);
  }

  return ensureCurrentProfile(user);
}

export async function setCurrentProfileRole(userId: string, role: RoleOption) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id, role, display_name, avatar_url")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return normalizeProfile(data);
}
