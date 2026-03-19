import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

import type { FeedPost } from "@/types/api";

export async function sharePost(post: FeedPost) {
  const message = `${post.author.displayName}: ${post.body}`;

  if (!(await Sharing.isAvailableAsync())) {
    await Share.share({ message });
    return;
  }

  const file = new File(Paths.cache, `post-${post.id}.txt`);
  file.write(message);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: "Share post",
    mimeType: "text/plain",
  });
}
