import type { FastifyInstance } from "fastify";
import { hashPassword, verifyPassword } from "../auth/password";
import { generateSessionToken, hashSessionToken } from "../auth/session-token";
import { pool } from "../db";
import { SESSION_COOKIE_NAME } from "../auth/constants";
import {
  createUser,
  deleteSessionByTokenHash,
  findUserByEmail,
  findUserBySessionTokenHash,
  insertSession,
  parseAuthorProfileUrls
} from "../users-repo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function setSessionCookieOnReply(reply: { setCookie: (n: string, v: string, o: object) => void }, token: string) {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60
  });
}

function clearSessionCookie(reply: { clearCookie: (n: string, o: object) => void }) {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

/** Tighter than the global API limit — slows credential stuffing and signup spam. */
const AUTH_WRITE_RATE = {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: "1 minute" as const
    }
  }
};

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", AUTH_WRITE_RATE, async (request, reply) => {
    if (!pool) {
      return reply.code(503).send({ error: "Database unavailable" });
    }

    const body = request.body as {
      email?: string;
      password?: string;
      hasPublications?: boolean;
      authorProfileUrls?: unknown;
    };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const hasPublications = body.hasPublications === true;
    const authorProfileUrls = Array.isArray(body.authorProfileUrls)
      ? body.authorProfileUrls
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
          .map((u) => u.trim())
          .slice(0, 10)
      : [];

    if (!EMAIL_RE.test(email)) {
      return reply.code(400).send({ error: "Invalid email" });
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters" });
    }
    for (const u of authorProfileUrls) {
      if (u.length > 2000) {
        return reply.code(400).send({ error: "Each profile URL must be at most 2000 characters" });
      }
    }

    const passwordHash = hashPassword(password);

    try {
      const user = await createUser(pool, email, passwordHash, {
        hasPublications,
        authorProfileUrls
      });
      const { token, tokenHash } = generateSessionToken();
      await insertSession(pool, user.id, tokenHash);
      setSessionCookieOnReply(reply, token);
      return {
        user: {
          id: user.id,
          email,
          hasPublications,
          authorProfileUrls
        }
      };
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? (e as { code: string }).code : "";
      if (code === "23505") {
        return reply.code(409).send({ error: "Email already registered" });
      }
      throw e;
    }
  });

  app.post("/auth/login", AUTH_WRITE_RATE, async (request, reply) => {
    if (!pool) {
      return reply.code(503).send({ error: "Database unavailable" });
    }

    const body = request.body as { email?: string; password?: string };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const row = await findUserByEmail(pool, email);
    if (!row || !verifyPassword(password, row.password_hash)) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const { token, tokenHash } = generateSessionToken();
    await insertSession(pool, row.id, tokenHash);
    setSessionCookieOnReply(reply, token);

    return {
      user: {
        id: row.id,
        email,
        hasPublications: row.has_publications,
        authorProfileUrls: parseAuthorProfileUrls(row.author_profile_urls)
      }
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    if (!pool) {
      clearSessionCookie(reply);
      return { ok: true };
    }

    const token = request.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await deleteSessionByTokenHash(pool, hashSessionToken(token));
    }
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/auth/me", async (request, reply) => {
    if (!pool) {
      return reply.code(503).send({ error: "Database unavailable" });
    }

    const token = request.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return { user: null };
    }

    const user = await findUserBySessionTokenHash(pool, hashSessionToken(token));
    if (!user) {
      clearSessionCookie(reply);
      return { user: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        hasPublications: user.has_publications,
        authorProfileUrls: parseAuthorProfileUrls(user.author_profile_urls)
      }
    };
  });
}
