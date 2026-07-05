import { TEST_DATABASE_URL, TEST_REDIS_URL } from "./test-db-config";

// Always target the test database/cache, never the dev ones - this must be
// set before any test file imports app modules (db/pool.ts, cache/redis.ts,
// modules/auth/tokens.ts all read these at import time).
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.REDIS_URL = TEST_REDIS_URL;
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.NODE_ENV = "test";
