"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";

export function FollowButton({
  userId,
  initialIsFollowing,
}: {
  userId: string;
  initialIsFollowing: boolean;
}) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!accessToken || pending) return;
    setPending(true);
    const next = !isFollowing;
    try {
      if (next) {
        await api.post(`/users/${userId}/follow`, undefined, accessToken);
      } else {
        await api.delete(`/users/${userId}/follow`, accessToken);
      }
      setIsFollowing(next);
      router.refresh();
    } catch {
      // leave state unchanged; user can retry
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={isFollowing ? "outline" : "accent"} onClick={toggle} disabled={pending}>
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
