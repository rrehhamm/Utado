"use client";

import { useAuth } from "../../lib/auth-context";
import { FollowButton } from "./FollowButton";

export function ProfileActions({
  profileId,
  initialIsFollowing,
}: {
  profileId: string;
  initialIsFollowing: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading || !user || user.id === profileId) return null;

  return <FollowButton userId={profileId} initialIsFollowing={initialIsFollowing} />;
}
