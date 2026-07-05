import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
  // The integration test suite calls register/login far more than 20 times
  // in a run; rate limiting itself isn't what those tests are exercising.
  skip: () => process.env.NODE_ENV === "test",
});
