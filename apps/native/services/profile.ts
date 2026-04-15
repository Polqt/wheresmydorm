import type { User } from "@supabase/supabase-js";

import { formatProfileName, getProfileNamePartsFromUser } from "@/lib/profile";
import { uploadFileUri } from "@/services/storage";
import type { RoleOption } from "@/types/auth";
import { supabase } from "@/utils/supabase";

export type NativeProfileRole = "finder" | "lister" | "admin" | null;

export type NativeProfile = {
  avatarUrl: string | null;
  bio: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  finderBudgetMax: string | null;
  finderBudgetMin: string | null;
  finderPropertyTypes: string[];
  firstName: string;
  fullName: string;
  id: string;
  analyticsExpiresAt: string | null;
  isPaidFinder: boolean;
  isVerifiedLister: boolean;
  isVerifiedMember: boolean;
  lastName: string | null;
  listerPropertyCount: number | null;
  preferredArea: string | null;
  propertyTypes: string[];
  role: NativeProfileRole;
};

type ProfileRow = {
  avatar_url: string | null;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  finder_budget_max: string | null;
  finder_budget_min: string | null;
  finder_property_types: string[];
  first_name: string;
  id: string;
  analytics_expires_at: string | null;
  is_paid_finder: boolean;
  is_verified_lister: boolean;
  is_verified_member: boolean;
  last_name: string | null;
  lister_property_count: number | null;
  preferred_area: string | null;
  property_types: string[];
  role: NativeProfileRole;
};

const PROFILE_SELECT =
  "id, role, first_name, last_name, avatar_url, bio, contact_email, contact_phone, is_verified_member, is_paid_finder, is_verified_lister, analytics_expires_at, preferred_area, finder_budget_min, finder_budget_max, finder_property_types, property_types, lister_property_count, created_at";

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
    bio: row.bio,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    finderBudgetMax: row.finder_budget_max,
    finderBudgetMin: row.finder_budget_min,
    finderPropertyTypes: row.finder_property_types ?? [],
    firstName: row.first_name,
    fullName: formatProfileName({
      firstName: row.first_name,
      lastName: row.last_name,
    }),
    analyticsExpiresAt: row.analytics_expires_at,
    id: row.id,
    isPaidFinder: row.is_paid_finder,
    isVerifiedLister: row.is_verified_lister,
    isVerifiedMember: row.is_verified_member,
    lastName: row.last_name,
    listerPropertyCount: row.lister_property_count,
    preferredArea: row.preferred_area,
    propertyTypes: row.property_types ?? [],
    role: row.role,
  };
}

export async function ensureCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(getProfileDefaults(user), { onConflict: "id" })
    .select(PROFILE_SELECT)
    .single<ProfileRow>();

  if (error) throw error;
  return normalizeProfile(data);
}

export async function getOrCreateCurrentProfile(user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  if (data) return normalizeProfile(data);
  return ensureCurrentProfile(user);
}

export async function setCurrentProfileRole(userId: string, role: RoleOption) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single<ProfileRow>();

  if (error) throw error;
  return normalizeProfile(data);
}

export type ProfileUpdateData = {
  firstName?: string;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  finderBudgetMax?: string | null;
  finderBudgetMin?: string | null;
  finderPropertyTypes?: string[];
  listerPropertyCount?: number | null;
  preferredArea?: string | null;
  propertyTypes?: string[];
};

export async function uploadAvatar(
  userId: string,
  uri: string,
): Promise<string> {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const path = `${userId}/avatar.${ext}`;
  const publicUrl = await uploadFileUri({
    bucket: "avatars",
    contentType: mime,
    filePath: path,
    upsert: true,
    uri,
  });
  return `${publicUrl}?t=${Date.now()}`;
}

export async function updateCurrentProfile(
  userId: string,
  updates: ProfileUpdateData,
): Promise<NativeProfile> {
  const row: Record<string, unknown> = {};
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.contactEmail !== undefined)
    row.contact_email = updates.contactEmail;
  if (updates.contactPhone !== undefined)
    row.contact_phone = updates.contactPhone;
  if (updates.finderBudgetMax !== undefined)
    row.finder_budget_max = updates.finderBudgetMax;
  if (updates.finderBudgetMin !== undefined)
    row.finder_budget_min = updates.finderBudgetMin;
  if (updates.finderPropertyTypes !== undefined)
    row.finder_property_types = updates.finderPropertyTypes;
  if (updates.listerPropertyCount !== undefined)
    row.lister_property_count = updates.listerPropertyCount;
  if (updates.preferredArea !== undefined)
    row.preferred_area = updates.preferredArea;
  if (updates.propertyTypes !== undefined)
    row.property_types = updates.propertyTypes;

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single<ProfileRow>();

  if (error) throw error;
  return normalizeProfile(data);
}
