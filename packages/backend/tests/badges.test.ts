import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("badge notifications", () => {
  it("records a notification the first time a badge is earned, and it can be marked seen", async () => {
    const { accessToken, user } = await registerUser("badgeuser");
    const songId = await getSongId(16);

    // No logs yet - no notifications.
    const before = await request(app)
      .get(`/api/v1/users/${user.id}/badge-notifications/unseen`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(before.body).toEqual([]);

    // Log a song - earns "first-log". Fetching stats is what discovers/records it.
    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId, rating: 4 })
      .expect(201);

    await request(app)
      .get(`/api/v1/users/${user.id}/stats`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const after = await request(app)
      .get(`/api/v1/users/${user.id}/badge-notifications/unseen`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(after.body).toHaveLength(1);
    expect(after.body[0]).toMatchObject({ slug: "first-log", label: "First Spin" });

    // Fetching stats again shouldn't duplicate the notification.
    await request(app)
      .get(`/api/v1/users/${user.id}/stats`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    const stillOne = await request(app)
      .get(`/api/v1/users/${user.id}/badge-notifications/unseen`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(stillOne.body).toHaveLength(1);

    // Mark it seen - it should no longer show as unseen.
    await request(app)
      .post(`/api/v1/users/${user.id}/badge-notifications/first-log/seen`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const afterSeen = await request(app)
      .get(`/api/v1/users/${user.id}/badge-notifications/unseen`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(afterSeen.body).toEqual([]);
  });

  it("prevents reading or acknowledging another user's badge notifications", async () => {
    const owner = await registerUser("badgeowner");
    const attacker = await registerUser("badgeattacker");

    const readAttempt = await request(app)
      .get(`/api/v1/users/${owner.user.id}/badge-notifications/unseen`)
      .set("Authorization", `Bearer ${attacker.accessToken}`);
    expect(readAttempt.status).toBe(403);

    const ackAttempt = await request(app)
      .post(`/api/v1/users/${owner.user.id}/badge-notifications/first-log/seen`)
      .set("Authorization", `Bearer ${attacker.accessToken}`);
    expect(ackAttempt.status).toBe(403);
  });
});
