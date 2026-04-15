const THREAD_ID_SEPARATOR = "__";

export function encodeMessageThreadId(listingId: string, otherUserId: string) {
  return `${listingId}${THREAD_ID_SEPARATOR}${otherUserId}`;
}
