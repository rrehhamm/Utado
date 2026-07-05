import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser } from "./helpers";

describe("follow graph", () => {
  it("rejects following yourself", async () => {
    const { accessToken, user } = await registerUser("selffollow");
    const res = await request(app)
      .post(`/api/v1/users/${user.id}/follow`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("cannot_follow_self");
  });

  it("follows and unfollows a user, updating counts and isFollowing", async () => {
    const alice = await registerUser("followalice");
    const bob = await registerUser("followbob");

    await request(app)
      .post(`/api/v1/users/${bob.user.id}/follow`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .expect(204);

    const bobProfile = await request(app)
      .get(`/api/v1/users/${bob.user.id}`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .expect(200);
    expect(bobProfile.body.followersCount).toBe(1);
    expect(bobProfile.body.isFollowing).toBe(true);

    const aliceProfile = await request(app).get(`/api/v1/users/${alice.user.id}`).expect(200);
    expect(aliceProfile.body.followingCount).toBe(1);

    const followers = await request(app).get(`/api/v1/users/${bob.user.id}/followers`).expect(200);
    expect(followers.body.map((u: { id: string }) => u.id)).toContain(alice.user.id);

    await request(app)
      .delete(`/api/v1/users/${bob.user.id}/follow`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .expect(204);

    const bobAfterUnfollow = await request(app)
      .get(`/api/v1/users/${bob.user.id}`)
      .set("Authorization", `Bearer ${alice.accessToken}`)
      .expect(200);
    expect(bobAfterUnfollow.body.followersCount).toBe(0);
    expect(bobAfterUnfollow.body.isFollowing).toBe(false);
  });

  it("isFollowing is false for an anonymous (unauthenticated) viewer", async () => {
    const { user } = await registerUser("anonviewtest");
    const res = await request(app).get(`/api/v1/users/${user.id}`).expect(200);
    expect(res.body.isFollowing).toBe(false);
  });
});
