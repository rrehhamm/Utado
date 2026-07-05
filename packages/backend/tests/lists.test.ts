import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("lists", () => {
  it("creates a list, adds and removes songs, and reflects itemsCount", async () => {
    const { accessToken } = await registerUser("listowner");
    const songA = await getSongId(0);
    const songB = await getSongId(1);

    const created = await request(app)
      .post("/api/v1/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Late Night Drives", description: "moody stuff" })
      .expect(201);
    expect(created.body.itemsCount).toBe(0);
    const listId = created.body.id;

    await request(app)
      .post(`/api/v1/lists/${listId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId: songA })
      .expect(201);
    await request(app)
      .post(`/api/v1/lists/${listId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId: songB })
      .expect(201);

    const withItems = await request(app).get(`/api/v1/lists/${listId}`).expect(200);
    expect(withItems.body.itemsCount).toBe(2);
    expect(withItems.body.items.map((i: { songId: string }) => i.songId).sort()).toEqual(
      [songA, songB].sort()
    );

    await request(app)
      .delete(`/api/v1/lists/${listId}/items/${songA}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(204);

    const afterRemove = await request(app).get(`/api/v1/lists/${listId}`).expect(200);
    expect(afterRemove.body.itemsCount).toBe(1);
    expect(afterRemove.body.items[0].songId).toBe(songB);
  });

  it("prevents a non-owner from modifying or deleting a list", async () => {
    const owner = await registerUser("listowner2");
    const attacker = await registerUser("listattacker");
    const songId = await getSongId(2);

    const created = await request(app)
      .post("/api/v1/lists")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "My List" })
      .expect(201);
    const listId = created.body.id;

    const addAttempt = await request(app)
      .post(`/api/v1/lists/${listId}/items`)
      .set("Authorization", `Bearer ${attacker.accessToken}`)
      .send({ songId });
    expect(addAttempt.status).toBe(403);

    const deleteAttempt = await request(app)
      .delete(`/api/v1/lists/${listId}`)
      .set("Authorization", `Bearer ${attacker.accessToken}`);
    expect(deleteAttempt.status).toBe(403);

    await request(app).get(`/api/v1/lists/${listId}`).expect(200);
  });

  it("adding the same song twice doesn't duplicate it", async () => {
    const { accessToken } = await registerUser("listdupe");
    const songId = await getSongId(3);

    const created = await request(app)
      .post("/api/v1/lists")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Dupe test" })
      .expect(201);
    const listId = created.body.id;

    await request(app)
      .post(`/api/v1/lists/${listId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId })
      .expect(201);
    await request(app)
      .post(`/api/v1/lists/${listId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId })
      .expect(201);

    const list = await request(app).get(`/api/v1/lists/${listId}`).expect(200);
    expect(list.body.itemsCount).toBe(1);
  });
});
