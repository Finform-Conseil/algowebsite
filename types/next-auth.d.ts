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
}