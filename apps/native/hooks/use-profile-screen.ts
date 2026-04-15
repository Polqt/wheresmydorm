import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCurrentProfile } from "@/hooks/use-current-profile";
import { useAuth } from "@/providers/auth-provider";
import { trpc } from "@/utils/api-client";
import { formatMemberSince, getInitials } from "@/utils/profile";

export function useProfileScreen() {
  const { signOut, user, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useCurrentProfile(user);

  const myListingsQuery = useQuery({
    ...trpc.listings.myListings.queryOptions(),
    enabled: role === "lister",
  });
  const savedListingsQuery = useQuery({
    ...trpc.listings.savedListings.queryOptions(),
    enabled: role === "finder",
  });
  const myReviewsQuery = useQuery({
    ...trpc.reviews.myReviews.queryOptions(),
    enabled: role === "finder",
  });
  const unreadNotificationsQuery = useQuery(
    trpc.notifications.unreadCount.queryOptions(),
  );

  const deleteAccount = useMutation(
    trpc.profiles.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await queryClient.clear();
        await signOut();
      },
    }),
  );

  const initials = useMemo(
    () => getInitials(profile?.firstName, profile?.lastName),
    [profile?.firstName, profile?.lastName],
  );

  const displayName =
    profile?.fullName ?? user?.email?.split("@")[0] ?? "Member";

  const stats = useMemo(
    () => [
      {
        label: role === "lister" ? "Listings" : "Saved",
        value:
          role === "lister"
            ? String(myListingsQuery.data?.length ?? 0)
            : String(savedListingsQuery.data?.length ?? 0),
      },
      {
        label: "Reviews",
        value:
          role === "finder"
            ? String(myReviewsQuery.data?.length ?? 0)
            : String(
                (myListingsQuery.data ?? []).reduce(
                  (count, listing) => count + (listing.reviewCount ?? 0),
                  0,
                ),
              ),
      },
      { label: "Member since", value: formatMemberSince(profile?.createdAt) },
    ],
    [
      myListingsQuery.data,
      myReviewsQuery.data?.length,
      profile?.createdAt,
      role,
      savedListingsQuery.data?.length,
    ],
  );

  return {
    deleteAccount,
    displayName,
    initials,
    profile,
    role,
    signOut,
    stats,
    unreadCount: unreadNotificationsQuery.data?.count ?? 0,
    user,
  };
}
