import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("logs", () => {
  it("creates a log and returns it with default like/comment counts", async () => {
    const { accessToken } = await registerUser("logcreate");
    const songId = await getSongId(0);

    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId, rating: 4.5, review: "great track" })
      .expect(201);

    expect(res.body.songId).toBe(songId);
    expect(res.body.rating).toBe(4.5);
    expect(res.body.likesCount).toBe(0);
    expect(res.body.commentsCount).toBe(0);
    expect(res.body.likedByMe).toBe(false);
  });

  it("rejects a rating outside the 0.5-5 half-star range", async () => {
    const { accessToken } = await registerUser("logvalidate");
    const songId = await getSongId(1);

    const res = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId, rating: 5.25 })
      .expect(400);

    expect(res.body.error).toBe("validation_error");
  });

  it("lists logs for a song ordered most-recent-first", async () => {
    const songId = await getSongId(2);
    const alice = await registerUser("logslist");
    const bob = await registerUser("logslist");

    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .send({ songId, rating: 3 })
      .expect(201);
    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${bob.accessToken}`)
      .send({ songId, rating: 5 })
      .expect(201);

    const res = await request(app).get(`/api/v1/logs?songId=${songId}`).expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Most recently created (bob's) should be first.
    expect(res.body[0].userId).toBe(bob.user.id);
  });

  it("prevents a user from updating or deleting another user's log", async () => {
    const owner = await registerUser("logowner");
    const attacker = await registerUser("logattacker");
    const songId = await getSongId(3);

    const created = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 4 })
      .expect(201);
    const logId = created.body.id;

    const updateAttempt = await request(app)
      .put(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .send({ rating: 1 });
    expect(updateAttempt.status).toBe(403);

    const deleteAttempt = await request(app)
      .delete(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${attacker.accessToken}`);
    expect(deleteAttempt.status).toBe(403);

    // Confirm it's untouched.
    const stillThere = await request(app).get(`/api/v1/logs/${logId}`).expect(200);
    expect(stillThere.body.rating).toBe(4);
  });

  it("lets the owner update and delete their own log", async () => {
    const owner = await registerUser("logselfedit");
    const songId = await getSongId(4);

    const created = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 2 })
      .expect(201);
    const logId = created.body.id;

    const updated = await request(app)
      .put(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ rating: 5, review: "changed my mind" })
      .expect(200);
    expect(updated.body.rating).toBe(5);
    expect(updated.body.review).toBe("changed my mind");

    await request(app)
      .delete(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    await request(app).get(`/api/v1/logs/${logId}`).expect(404);
  });

  it("likes and unlikes a log, reflected in likesCount and likedByMe", async () => {
    const owner = await registerUser("likeowner");
    const liker = await registerUser("liker");
    const songId = await getSongId(5);

    const created = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 3 })
      .expect(201);
    const logId = created.body.id;

    await request(app)
      .post(`/api/v1/logs/${logId}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`)
      .expect(204);

    const liked = await request(app)
      .get(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${liker.accessToken}`)
      .expect(200);
    expect(liked.body.likesCount).toBe(1);
    expect(liked.body.likedByMe).toBe(true);

    await request(app)
      .delete(`/api/v1/logs/${logId}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`)
      .expect(204);

    const unliked = await request(app)
      .get(`/api/v1/logs/${logId}`)
      .set("Authorization", `Bearer ${liker.accessToken}`)
      .expect(200);
    expect(unliked.body.likesCount).toBe(0);
    expect(unliked.body.likedByMe).toBe(false);
  });
});
