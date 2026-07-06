import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser } from "./helpers";

describe("avatar upload", () => {
  it("prevents uploading an avatar for another user", async () => {
    const owner = await registerUser("avatarowner");
    const attacker = await registerUser("avatarattacker");

    const res = await request(app)
      .post(`/api/v1/users/${owner.user.id}/avatar`)
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .attach("avatar", Buffer.from("not a real image"), "avatar.png");

    expect(res.status).toBe(403);
  });

  it("degrades gracefully with a 503 when Cloudinary isn't configured", async () => {
    // The test environment intentionally has no CLOUDINARY_* env vars set
    // (see tests/env-setup.ts) - this is what a real deployment without
    // image uploads configured should also see, rather than a crash.
    const { accessToken, user } = await registerUser("avatarnotconfigured");

    const res = await request(app)
      .post(`/api/v1/users/${user.id}/avatar`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("fake png bytes"), "avatar.png");

    expect(res.status).toBe(503);
    expect(res.body.error).toBe("image_uploads_not_configured");
  });
});
