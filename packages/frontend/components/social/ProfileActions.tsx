"use client";

import { useEffect, useState } from "react";
import type { PublicUser } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { FollowButton } from "./FollowButton";

export function ProfileActions({ profileId }: { profileId: string }) {
  const { user, accessToken, loading } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !accessToken || !user || user.id === profileId) return;
    api
      .get<PublicUser>(`/users/${profileId}`, accessToken)
      .then((u) => setIsFollowing(!!u.isFollowing))
      .catch(() => undefined);
  }, [loading, accessToken, user, profileId]);

  if (loading || !user || user.id === profileId || isFollowing === null) return null;

  return <FollowButton userId={profileId} initialIsFollowing={isFollowing} />;
}
