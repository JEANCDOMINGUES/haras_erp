import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

const DEV_MOCK_USER: User = {
  id: 999,
  openId: "dev-user-1",
  name: "Dev User",
  email: "dev@localhost",
  loginMethod: "dev",
  role: "admin",
  harasId: 1,
  ativo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  if (ENV.devMode) {
    const devUser = { ...DEV_MOCK_USER };
    if (ENV.devUserId) devUser.openId = ENV.devUserId;
    if (ENV.devUserName) devUser.name = ENV.devUserName;
    if (ENV.devUserRole) devUser.role = ENV.devUserRole;

    return {
      req: opts.req,
      res: opts.res,
      user: devUser,
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
