import { describe, expect, it } from "vitest";
import request from "supertest";
import { app, registerUser, uniqueSuffix } from "./helpers";

describe("auth", () => {
  it("registers a new user and returns an access token + user", async () => {
    const { accessToken, user } = await registerUser("regtest");
    expect(accessToken).toBeTypeOf("string");
    expect(user.username).toMatch(/^regtest/);
    expect(user.email).toContain("@example.com");
  });

  it("rejects duplicate registration with the same email", async () => {
    const suffix = uniqueSuffix();
    const payload = { username: `dup${suffix}`, email: `dup${suffix}@example.com`, password: "testpass123" };
    await request(app).post("/api/v1/auth/register").send(payload).expect(201);
    const res = await request(app).post("/api/v1/auth/register").send(payload).expect(409);
    expect(res.body.error).toBe("username_or_email_taken");
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    const suffix = uniqueSuffix();
    const email = `logintest${suffix}@example.com`;
    await request(app)
      .post("/api/v1/auth/register")
      .send({ username: `logintest${suffix}`, email, password: "testpass123" })
      .expect(201);

    const good = await request(app).post("/api/v1/auth/login").send({ email, password: "testpass123" });
    expect(good.status).toBe(200);
    expect(good.body.accessToken).toBeTypeOf("string");

    const bad = await request(app).post("/api/v1/auth/login").send({ email, password: "wrongpass" });
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe("invalid_credentials");
  });

  it("refreshes a session using the refresh cookie and rotates it", async () => {
    const suffix = uniqueSuffix();
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: `refresh${suffix}`, email: `refresh${suffix}@example.com`, password: "testpass123" })
      .expect(201);

    const cookie = registerRes.headers["set-cookie"][0];

    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookie)
      .expect(200);
    expect(refreshRes.body.accessToken).toBeTypeOf("string");
    expect(refreshRes.body.user.id).toBe(registerRes.body.user.id);

    // The rotated-out refresh token should now be rejected.
    const reuse = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(reuse.status).toBe(401);
  });

  it("rejects protected routes without a token and accepts them with one", async () => {
    const { accessToken } = await registerUser("protectedtest");

    const noAuth = await request(app).put("/api/v1/users/00000000-0000-0000-0000-000000000000").send({});
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .put(`/api/v1/users/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "hi" });
    // Forbidden because the token's user doesn't match the :id in the URL - proves the
    // token was accepted (past the 401 auth gate) and the ownership check then kicked in.
    expect(withAuth.status).toBe(403);
  });
});
