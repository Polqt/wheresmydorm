import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, Text, View } from "react-native";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  initials: string;
  onPress?: () => void;
  size?: number;
};

export const ProfileAvatar = React.memo(function ProfileAvatar({
  avatarUrl,
  initials,
  onPress,
  size = 88,
}: ProfileAvatarProps) {
  const radius = size / 2;
  const badgeSize = Math.round(size * 0.3);
  const badgeOffset = Math.round(size * 0.04);

  return (
    <Pressable
      disabled={!onPress}
      hitSlop={8}
      onPress={onPress}
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: radius }}
          transition={200}
        />
      ) : (
        <View
          className="items-center justify-center bg-[#0B2D23]"
          style={{ width: size, height: size, borderRadius: radius }}
        >
          <Text
            className="font-bold text-white"
            style={{ fontSize: size * 0.3 }}
          >
            {initials}
          </Text>
        </View>
      )}

      {onPress ? (
        <View
          className="absolute items-center justify-center border-2 border-white bg-[#0B2D23]"
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            bottom: badgeOffset,
            right: badgeOffset,
          }}
        >
          <Ionicons color="#ffffff" name="camera" size={badgeSize * 0.5} />
        </View>
      ) : null}
    </Pressable>
  );
});
