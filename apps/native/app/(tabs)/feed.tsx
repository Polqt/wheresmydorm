import { FinderFeedScreen } from "@/components/screens/finder/finder-feed-screen";
import { ListerFeedScreen } from "@/components/screens/lister/lister-feed-screen";
import { useAuth } from "@/providers/auth-provider";

export default function FeedTabScreen() {
  const { role } = useAuth();
  return role === "lister" ? <ListerFeedScreen /> : <FinderFeedScreen />;
}
