import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis client error:", err.message));

let connecting: Promise<void> | null = null;

async function ensureConnected() {
  if (redisClient.isOpen) return;
  connecting ??= redisClient.connect().then(() => undefined);
  await connecting;
}

/**
 * Cache is a pure optimization layer: any Redis failure is swallowed and
 * treated as a cache miss so the API degrades to hitting Postgres directly
 * rather than breaking when Redis is unavailable.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    await ensureConnected();
    const raw = await redisClient.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error("Redis get failed, falling back to DB:", (err as Error).message);
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await ensureConnected();
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error("Redis set failed:", (err as Error).message);
  }
}

export async function invalidateKey(key: string): Promise<void> {
  try {
    await ensureConnected();
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis invalidate failed:", (err as Error).message);
  }
}

export async function invalidateByPrefix(prefix: string): Promise<void> {
  try {
    await ensureConnected();
    for await (const key of redisClient.scanIterator({ MATCH: `${prefix}*` })) {
      await redisClient.del(String(key));
    }
  } catch (err) {
    console.error("Redis prefix invalidate failed:", (err as Error).message);
  }
}
