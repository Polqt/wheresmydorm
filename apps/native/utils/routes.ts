import type { Href } from "expo-router";

import type { RoleOption } from "@/types/auth";

type AppRole = RoleOption | "admin" | null | undefined;

export function finderHomeRoute(): Href {
  return "/(finder-tabs)/map";
}

export function listerHomeRoute(): Href {
  return "/(lister-tabs)/dashboard";
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
  return "/(finder-tabs)/saved";
}

export function listerListingsTabRoute(): Href {
  return "/(lister-tabs)/listings";
}

export function listerInboxTabRoute(): Href {
  return "/(lister-tabs)/inbox";
}

export function roleFeedRoute(role: AppRole): Href {
  return role === "lister" ? "/(lister-tabs)/feed" : "/(finder-tabs)/feed";
}

export function messagesInboxRoute(): Href {
  return "/messages";
}

export function notificationsRoute(): Href {
  return "/notifications";
}

export function paymentsRoute(): Href {
  return "/payments" as Href;
}

export function reviewsRoute(): Href {
  return "/reviews" as Href;
}

export function adminConversationReportsRoute(): Href {
  return "/admin/conversation-reports" as Href;
}

export function adminPostReportsRoute(): Href {
  return "/admin/post-reports" as Href;
}

export function adminUsersRoute(): Href {
  return "/admin/users" as Href;
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

export function aiChatRoute(): Href {
  return "/chat" as Href;
}
