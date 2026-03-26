import type { Href } from "expo-router";

export function createListingRoute(): Href {
  return "/listings/create";
}

export function myListingsRoute(): Href {
  return "/listings/my";
}

export function postCreateRoute(): Href {
  return "/post/create";
}

export function profileEditRoute(): Href {
  return "/profile/edit";
}

export function savedListingsRoute(): Href {
  return "/saved";
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
