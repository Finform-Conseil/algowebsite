import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email?: string | null;
            accessToken?: string;
            refreshToken?: string;
            number?: string;
            first_name?: string;
            last_name?: string;
            phone?: string;
            profile?: string;
            roles?: string[];
        };
    }

    interface User extends DefaultUser {
        id: string;
        accessToken: string;
        refreshToken: string;
        number?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        profile?: string;
        roles?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        accessToken: string;
        refreshToken: string;
        matricule?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        profile?: string;
        roles?: string[];
    }
}import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the session.user to include custom properties
   */
  interface Session {
    user: {
      id: string;
      first_name: string;
      last_name: string;
      role: string;
      username: string;
    } & DefaultSession["user"];
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    username: string;
    access: string;
    refresh: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}
