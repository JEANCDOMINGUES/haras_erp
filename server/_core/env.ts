export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  devMode: process.env.DEV_MODE === "true",
  devUserId: process.env.DEV_USER_ID ?? "dev-user-1",
  devUserName: process.env.DEV_USER_NAME ?? "Dev User",
  devUserRole: (process.env.DEV_USER_ROLE as "admin" | "user") ?? "admin",
};
