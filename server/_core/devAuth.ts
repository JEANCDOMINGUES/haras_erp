import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { SignJWT } from "jose";

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

async function createDevSessionToken(
  openId: string,
  name: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  return new SignJWT({
    openId,
    appId: ENV.appId || "dev-app",
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secretKey);
}

export function registerDevRoutes(app: Express) {
  if (!ENV.devMode) {
    return;
  }

  app.get("/api/dev/login", async (req: Request, res: Response) => {
    const userId = ENV.devUserId;
    const userName = ENV.devUserName;
    const userRole = ENV.devUserRole;

    try {
      const sessionToken = await createDevSessionToken(userId, userName);
      const cookieOptions = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({
        success: true,
        user: {
          openId: userId,
          name: userName,
          role: userRole,
        },
        mode: "development",
      });
    } catch (error) {
      console.error("[Dev Auth] Login failed:", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  app.get("/api/dev/status", (req: Request, res: Response) => {
    res.json({
      devMode: ENV.devMode,
      user: ENV.devMode
        ? {
            openId: ENV.devUserId,
            name: ENV.devUserName,
            role: ENV.devUserRole,
          }
        : null,
    });
  });

  console.log("[Dev] Development auth routes registered");
}
