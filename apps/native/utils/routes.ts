import type { Href } from "expo-router";

import type { RoleOption } from "@/types/auth";

type AppRole = RoleOption | "admin" | null | undefined;

export function finderHomeRoute(): Href {
  return "/(tabs)/map";
}

export function listerHomeRoute(): Href {
  return "/(tabs)/dashboard";
}

export function roleHomeRoute(role: AppRole): Href {
  return role === "lister" ? listerHomeRoute() : finderHomeRoute();
}

export function createListingRoute(): Href {
  return "/listings/create";
}

export function myListingsRoute(): Href {
  return "/listings/my";
}

export function postCreateRoute(listingId?: string): Href {
  return listingId
    ? {
        pathname: "/post/create",
        params: { listingId },
      }
    : "/post/create";
}

export function profileEditRoute(): Href {
  return "/profile/edit";
}

export function savedListingsRoute(): Href {
  return "/saved";
}

export function listerListingsTabRoute(): Href {
  return "/(tabs)/listings";
}

export function listerInboxTabRoute(): Href {
  return "/(tabs)/inbox";
}

export function messagesInboxRoute(): Href {
  return "/messages";
}

export function listingDetailRoute(id: string): Href {
  return {
    pathname: "/listing/[id]",
    params: { id },
  };
}

export function listingEditRoute(id: string): Href {
  return {
    pathname: "/listings/[id]",
    params: { id },
  };
}

export function messageThreadRoute(threadId: string): Href {
  return {
    pathname: "/messages/[threadId]",
    params: { threadId },
  };
}

export function postDetailRoute(id: string): Href {
  return {
    pathname: "/post/[id]",
    params: { id },
  };
}
