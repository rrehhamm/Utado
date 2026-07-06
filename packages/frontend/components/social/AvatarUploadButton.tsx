"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@utado/shared";
import { useAuth } from "../../lib/auth-context";
import { ApiError, uploadFile } from "../../lib/api";

export function AvatarUploadButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.id !== profileId) return null;

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await uploadFile<PublicUser>(`/users/${profileId}/avatar`, formData, accessToken);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError("Image uploads aren't configured on this server yet.");
      } else {
        setError("Something went wrong uploading that image.");
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={pending}
        className="hidden"
        id="avatar-upload-input"
      />
      <label
        htmlFor="avatar-upload-input"
        className={`cursor-pointer text-xs font-semibold text-brown-dark hover:underline ${
          pending ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {pending ? "Uploading…" : "Change photo"}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
