import "./env";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { closeDb } from "./db";
import { registerAuthRoutes } from "./routes/auth";
import { registerFeedRoutes } from "./routes/feed";
import { registerMeRoutes } from "./routes/me";

const app = Fastify({ logger: true });

const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

await app.register(cookie);
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    cb(null, webOrigins.includes(origin));
  },
  credentials: true
});
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await registerFeedRoutes(app);
await registerAuthRoutes(app);
await registerMeRoutes(app);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const close = async () => {
  await closeDb();
  await app.close();
};

process.on("SIGINT", close);
process.on("SIGTERM", close);

await app.listen({ port, host });
