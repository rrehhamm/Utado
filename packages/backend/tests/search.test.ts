import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./helpers";

describe("search", () => {
  it("finds an artist by a partial, case-insensitive name match", async () => {
    const res = await request(app).get("/api/v1/search?q=kilo").expect(200);
    expect(res.body.artists.some((a: { name: string }) => a.name === "Kilowatt")).toBe(true);
  });

  it("finds albums and songs alongside artists", async () => {
    const res = await request(app).get("/api/v1/search?q=a").expect(200);
    expect(res.body.artists.length).toBeGreaterThan(0);
    expect(res.body.albums.length).toBeGreaterThan(0);
    expect(res.body.songs.length).toBeGreaterThan(0);
  });

  it("ranks exact-prefix matches above mid-string matches", async () => {
    const res = await request(app).get("/api/v1/search?q=Kilowatt").expect(200);
    expect(res.body.artists[0].name).toBe("Kilowatt");
  });

  it("returns empty result sets for a query with no matches", async () => {
    const res = await request(app).get("/api/v1/search?q=zzzznomatchzzzz").expect(200);
    expect(res.body).toEqual({ artists: [], albums: [], songs: [] });
  });

  it("returns empty result sets for an empty query instead of erroring", async () => {
    const res = await request(app).get("/api/v1/search?q=").expect(200);
    expect(res.body).toEqual({ artists: [], albums: [], songs: [] });
  });
});
