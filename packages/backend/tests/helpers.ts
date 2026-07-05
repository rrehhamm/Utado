import request from "supertest";
import { createApp } from "../src/app";

export const app = createApp();

export function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface RegisteredUser {
  accessToken: string;
  user: { id: string; username: string; email: string };
}

export async function registerUser(usernamePrefix: string): Promise<RegisteredUser> {
  const suffix = uniqueSuffix();
  const username = `${usernamePrefix}${suffix}`.slice(0, 30);
  const email = `${username}@example.com`;
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ username, email, password: "testpass123" })
    .expect(201);
  return res.body;
}

export async function getFirstSongId(): Promise<string> {
  const res = await request(app).get("/api/v1/songs").expect(200);
  return res.body[0].id;
}

export async function getSongId(index: number): Promise<string> {
  const res = await request(app).get("/api/v1/songs").expect(200);
  return res.body[index].id;
}
