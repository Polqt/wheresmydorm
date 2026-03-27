import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo, useCallback } from "react";
import type { ComponentProps } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, Text, View } from "react-native";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { FeedItem, PostReaction } from "@/types/posts";
import { formatMemberSince, getInitials } from "@/utils/profile";

const REACTION_OPTIONS = [
  { icon: "heart", label: "Like", value: "like" },
  { icon: "bulb", label: "Helpful", value: "helpful" },
  { icon: "happy", label: "Funny", value: "funny" },
] as const;

export const FeedPostCard = memo(function FeedPostCard({
  item,
  onFollow,
  onReact,
  onPress,
  onShare,
}: {
  item: FeedItem;
  onFollow: (userId: string) => void;
  onReact: (postId: string, reaction: PostReaction) => void;
  onPress: (postId: string) => void;
  onShare: (item: FeedItem) => void;
}) {
  const nameParts = item.author.displayName.split(" ");
  const initials = getInitials(nameParts[0], nameParts[1]);

  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);
  const handleFollow = useCallback(
    () => onFollow(item.author.id),
    [item.author.id, onFollow],
  );
  const handleShare = useCallback(() => onShare(item), [item, onShare]);

  return (
    <Pressable className="py-[18px]" onPress={handlePress}>
      <View className="flex-row items-center gap-2.5">
        <ProfileAvatar
          avatarUrl={item.author.avatarUrl}
          initials={initials}
          size={40}
        />
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-[#111827]">
            {item.author.displayName}
          </Text>
          <Text className="mt-px text-[12px] text-[#9B9387]">
            {formatMemberSince(String(item.createdAt))}
          </Text>
        </View>
        {item.author.isCurrentUser ? null : (
          <Pressable
            className="rounded-full bg-[#F3EEE6] px-3 py-[7px]"
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              handleFollow();
            }}
          >
            <Text
              className="text-[12px] font-bold"
              style={{ color: item.author.isFollowing ? "#0B2D23" : "#111827" }}
            >
              {item.author.isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        )}
      </View>

      <Text className="mt-3 text-[15px] leading-[23px] text-slate-700">
        {item.body}
      </Text>

      {item.mediaUrls.length > 0 ? (
        <View className="mt-3.5 flex-row gap-2">
          {item.mediaUrls.slice(0, 3).map((url) => (
            <Image
              key={url}
              className="h-28 flex-1 rounded-[18px]"
              contentFit="cover"
              source={{ uri: url }}
            />
          ))}
        </View>
      ) : null}

      {item.listing ? (
        <View className="mt-3 flex-row items-center gap-1.5">
          <Ionicons color="#0B2D23" name="home-outline" size={12} />
          <Text
            className="flex-1 text-[13px] font-semibold text-[#0B2D23]"
            numberOfLines={1}
          >
            {item.listing.title}
          </Text>
        </View>
      ) : null}

      {item.hashtags.length > 0 ? (
        <View className="mt-2.5 flex-row flex-wrap gap-2">
          {item.hashtags.slice(0, 4).map((tag) => (
            <Text key={tag} className="text-[13px] font-semibold text-[#4C7A67]">
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="mt-3.5 flex-row flex-wrap gap-3">
        {REACTION_OPTIONS.map((reaction) => {
          const isActive = item.viewerReaction === reaction.value;
          const iconName = isActive ? reaction.icon : `${reaction.icon}-outline`;
          const count = item.reactionSummary[reaction.value];

          return (
            <Pressable
              key={reaction.value}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
                isActive ? "bg-[#FBE9E7]" : "bg-[#F5F0E7]"
              }`}
              hitSlop={8}
              onPress={(event: GestureResponderEvent) => {
                event.stopPropagation();
                onReact(item.id, reaction.value);
              }}
            >
              <Ionicons
                color={isActive ? "#D14B3F" : "#8C8478"}
                name={iconName as ComponentProps<typeof Ionicons>["name"]}
                size={16}
              />
              <Text
                className={`text-[12px] font-semibold ${
                  isActive ? "text-[#A33C33]" : "text-[#6F685E]"
                }`}
              >
                {reaction.label} {count > 0 ? count : ""}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          className="flex-row items-center gap-1.5"
          hitSlop={8}
          onPress={handlePress}
        >
          <Ionicons color="#8C8478" name="chatbubble-outline" size={17} />
          <Text className="text-[13px] font-semibold text-[#6F685E]">
            {item.commentCount}
          </Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5"
          hitSlop={8}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            handleShare();
          }}
        >
          <Ionicons color="#8C8478" name="share-social-outline" size={17} />
          <Text className="text-[13px] font-semibold text-[#6F685E]">
            Share
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
});
