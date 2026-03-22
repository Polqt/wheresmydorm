import type { User } from "@supabase/supabase-js";

type ProfileNameParts = {
  firstName: string;
  lastName: string | null;
};

function splitNameParts(value: string) {
  const trimmedValue = value.trim().replace(/\s+/g, " ");

  if (trimmedValue.length === 0) {
    return {
      firstName: "Member",
      lastName: null,
    };
  }

  const [firstName, ...rest] = trimmedValue.split(" ");

  return {
    firstName: firstName ?? "Member",
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
}

export function getProfileNamePartsFromUser(user: User): ProfileNameParts {
  const fallbackName = user.email?.split("@")[0] ?? "Member";
  const fullName =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    fallbackName;

  return splitNameParts(fullName);
}

export function formatProfileName(parts: {
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = [parts.firstName, parts.lastName]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();

  return fullName.length > 0 ? fullName : "Member";
}
