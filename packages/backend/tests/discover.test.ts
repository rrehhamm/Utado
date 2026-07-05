import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, getSongId, registerUser } from "./helpers";

describe("discover", () => {
  it("ranks top-rated songs by average rating descending", async () => {
    const { accessToken } = await registerUser("discoverrank");
    const highRated = await getSongId(11);
    const lowRated = await getSongId(12);

    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId: highRated, rating: 5 })
      .expect(201);
    await request(app)
      .post("/api/v1/logs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ songId: lowRated, rating: 1 })
      .expect(201);

    const res = await request(app).get("/api/v1/discover/top-rated?limit=50").expect(200);
    const ids = res.body.map((s: { id: string }) => s.id);
    expect(ids.indexOf(highRated)).toBeLessThan(ids.indexOf(lowRated));
  });

  it("paginates with offset returning disjoint pages", async () => {
    const page1 = await request(app).get("/api/v1/discover/top-rated?limit=2&offset=0").expect(200);
    const page2 = await request(app).get("/api/v1/discover/top-rated?limit=2&offset=2").expect(200);

    const page1Ids = new Set(page1.body.map((s: { id: string }) => s.id));
    const overlap = page2.body.filter((s: { id: string }) => page1Ids.has(s.id));
    expect(overlap).toHaveLength(0);
  });
});
