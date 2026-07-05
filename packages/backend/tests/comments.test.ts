import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("comments", () => {
  it("posts and lists comments on a log, oldest first", async () => {
    const owner = await registerUser("commentowner");
    const commenter = await registerUser("commenter");
    const songId = await getSongId(13);

    const log = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 4 })
      .expect(201);
    const logId = log.body.id;

    await request(app)
      .post(`/api/v1/logs/${logId}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ body: "first!" })
      .expect(201);
    await request(app)
      .post(`/api/v1/logs/${logId}/comments`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ body: "thanks for listening" })
      .expect(201);

    const list = await request(app).get(`/api/v1/logs/${logId}/comments`).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0].body).toBe("first!");
    expect(list.body[1].body).toBe("thanks for listening");
  });

  it("rejects an empty comment body", async () => {
    const owner = await registerUser("commentempty");
    const songId = await getSongId(14);

    const log = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 4 })
      .expect(201);

    const res = await request(app)
      .post(`/api/v1/logs/${log.body.id}/comments`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ body: "" });
    expect(res.status).toBe(400);
  });

  it("prevents a non-author from deleting someone else's comment", async () => {
    const owner = await registerUser("commentdelowner");
    const author = await registerUser("commentauthor");
    const attacker = await registerUser("commentattacker");
    const songId = await getSongId(15);

    const log = await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ songId, rating: 3 })
      .expect(201);

    const comment = await request(app)
      .post(`/api/v1/logs/${log.body.id}/comments`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ body: "my comment" })
      .expect(201);

    const attempt = await request(app)
      .delete(`/api/v1/logs/${log.body.id}/comments/${comment.body.id}`)
      .set("Authorization", `Bearer ${attacker.accessToken}`);
    expect(attempt.status).toBe(403);

    await request(app)
      .delete(`/api/v1/logs/${log.body.id}/comments/${comment.body.id}`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .expect(204);
  });
});
