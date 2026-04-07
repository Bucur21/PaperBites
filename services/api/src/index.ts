import "./env";

import cors from "@fastify/cors";
import Fastify from "fastify";
import { closeDb } from "./db";
import { registerFeedRoutes } from "./routes/feed";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await registerFeedRoutes(app);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const close = async () => {
  await closeDb();
  await app.close();
};

process.on("SIGINT", close);
process.on("SIGTERM", close);

await app.listen({ port, host });
