import type { User } from "@supabase/supabase-js";

import { formatProfileName, getProfileNamePartsFromUser } from "@/lib/profile";
import type { RoleOption } from "@/types/auth";
import { supabase } from "@/utils/supabase";

export type NativeProfileRole = "finder" | "lister" | "admin" | null;

export type NativeProfile = {
  avatarUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  firstName: string;
  fullName: string;
  id: string;
  isVerifiedMember: boolean;
  lastName: string | null;
  role: NativeProfileRole;
};

type ProfileRow = {
  avatar_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  first_name: string;
  id: string;
  is_verified_member: boolean;
  last_name: string | null;
  role: NativeProfileRole;
};

function getProfileDefaults(user: User) {
  const { firstName, lastName } = getProfileNamePartsFromUser(user);
  const avatarUrl =
    (user.user_metadata.avatar_url as string | undefined) ?? null;

  return {
    avatar_url: avatarUrl,
    first_name: firstName,
    id: user.id,
    last_name: lastName,
  };
}

function normalizeProfile(row: ProfileRow): NativeProfile {
  return {
    avatarUrl: row.avatar_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    firstName: row.first_name,
    fullName: formatProfileName({
      firstName: row.first_name,
      lastName: row.last_name,
    }),
    id: row.id,
    isVerifiedMember: row.is_verified_member,
    lastName: row.last_name,
    role: row.role,
  };
}

export async function ensureCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(getProfileDefaults(user), {
      onConflict: "id",
    })
    .select("id, role, first_name, last_name, avatar_url, contact_email, contact_phone, is_verified_member, created_at")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return normalizeProfile(data);
}

export async function getOrCreateCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, avatar_url, contact_email, contact_phone, is_verified_member, created_at")
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
    .select("id, role, first_name, last_name, avatar_url, contact_email, contact_phone, is_verified_member, created_at")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return normalizeProfile(data);
}

export type ProfileUpdateData = {
  firstName?: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export async function uploadAvatar(
  userId: string,
  uri: string,
): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, {
      contentType: mime,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateCurrentProfile(
  userId: string,
  updates: ProfileUpdateData,
): Promise<NativeProfile> {
  const row: Record<string, unknown> = {};
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
  if (updates.contactEmail !== undefined) row.contact_email = updates.contactEmail;
  if (updates.contactPhone !== undefined) row.contact_phone = updates.contactPhone;

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select("id, role, first_name, last_name, avatar_url, contact_email, contact_phone, is_verified_member, created_at")
    .single<ProfileRow>();

  if (error) throw error;
  return normalizeProfile(data);
}
