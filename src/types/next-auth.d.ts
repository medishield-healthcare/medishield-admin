import type { DefaultSession } from "next-auth";

// Describe the token already returned by the existing authentication callbacks.
// These declarations do not change session or authentication behavior.
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      access_token?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
  }
}
