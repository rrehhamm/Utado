import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("feed", () => {
  it("only shows logs from users the caller follows, and reflects a new log instantly despite caching", async () => {
    const viewer = await registerUser("feedviewer");
    const followed = await registerUser("feedfollowed");
    const stranger = await registerUser("feedstranger");
    const songId = await getSongId(6);

    await request(app)
      .post(`/api/v1/users/${followed.user.id}/follow`)
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(204);

    // Stranger's log should never appear, even though nobody follows them yet.
    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${stranger.accessToken}`)
      .send({ songId, rating: 1 })
      .expect(201);

    const emptyFeed = await request(app)
      .get("/api/v1/feed")
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(emptyFeed.body).toEqual([]);

    // Populates the feed cache for viewer at zero entries, then followed logs
    // something - the feed must reflect it immediately (write-path invalidation),
    // not after the cache TTL.
    const followedLog = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${followed.accessToken}`)
      .send({ songId, rating: 5 })
      .expect(201);

    const feedAfter = await request(app)
      .get("/api/v1/feed")
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(feedAfter.body).toHaveLength(1);
    expect(feedAfter.body[0].id).toBe(followedLog.body.id);
    expect(feedAfter.body[0].userId).toBe(followed.user.id);
  });

  it("paginates with limit + before cursor without overlapping pages", async () => {
    const viewer = await registerUser("feedpageviewer");
    const followed = await registerUser("feedpagefollowed");
    const songId = await getSongId(7);

    await request(app)
      .post(`/api/v1/users/${followed.user.id}/follow`)
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(204);

    const songs = [7, 8, 9, 10].map((i) => i);
    for (const i of songs) {
      const sid = await getSongId(i);
      await request(app)
        .post("/api/v1/logs")
        .set("Authorization", `Bearer ${followed.accessToken}`)
        .send({ songId: sid, rating: 3 })
        .expect(201);
    }

    const page1 = await request(app)
      .get("/api/v1/feed?limit=2")
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(200);
    expect(page1.body).toHaveLength(2);

    const cursor = page1.body[page1.body.length - 1].createdAt;
    const page2 = await request(app)
      .get(`/api/v1/feed?limit=2&before=${encodeURIComponent(cursor)}`)
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .expect(200);

    const page1Ids = new Set(page1.body.map((l: { id: string }) => l.id));
    const overlap = page2.body.filter((l: { id: string }) => page1Ids.has(l.id));
    expect(overlap).toHaveLength(0);
  });
});
