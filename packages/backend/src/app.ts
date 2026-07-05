import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { artistsRouter } from "./modules/artists/artists.router";
import { albumsRouter } from "./modules/albums/albums.router";
import { songsRouter } from "./modules/songs/songs.router";
import { logsRouter } from "./modules/logs/logs.router";
import { commentsRouter } from "./modules/comments/comments.router";
import { feedRouter } from "./modules/feed/feed.router";
import { listsRouter } from "./modules/lists/lists.router";
import { discoverRouter } from "./modules/discover/discover.router";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRateLimiter } from "./middleware/rateLimit";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/v1/auth", authRateLimiter, authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/artists", artistsRouter);
  app.use("/api/v1/albums", albumsRouter);
  app.use("/api/v1/songs", songsRouter);
  app.use("/api/v1/logs", logsRouter);
  app.use("/api/v1/logs/:logId/comments", commentsRouter);
  app.use("/api/v1/feed", feedRouter);
  app.use("/api/v1/lists", listsRouter);
  app.use("/api/v1/discover", discoverRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
