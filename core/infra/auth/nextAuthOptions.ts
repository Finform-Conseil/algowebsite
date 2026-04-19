import { AuthOptions, DefaultUser, NextAuthOptions } from "next-auth";
import  CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

interface ExtendedUser extends DefaultUser {
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

export const authConfig : AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "johndoe@gmail.com" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials, req) : Promise<ExtendedUser | null> => {
                try {
                    console.log("=== AUTHORIZE START ===");
                    
                    if(!credentials?.email || !credentials?.password) {
                        console.error("Missing credentials");
                        throw new Error("L'adresse mail et le mot de passe sont requis");
                    }
                    
                    console.log("Calling login API...");
                    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/v1/users/login/`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });
                    
                    const result = await res.json();
                    console.log("Login API response status:", res.status);
                    console.log("Login API response body:", result);
                    
                    if (!res.ok) {
                        console.error("Login failed:", result);
                        return null;
                    }

                    const { access_token, refresh_token } = result;
                    console.log("Tokens received:", { 
                        hasAccessToken: !!access_token, 
                        hasRefreshToken: !!refresh_token 
                    });
                    
                    const decoded: any = jwtDecode(access_token);
                    const userId = decoded.user_id;
                    console.log("Decoded user_id:", userId);
                    
                    // Récupérer les informations complètes de l'utilisateur
                    try {
                        const userRes = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/v1/users/me/`, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${access_token}`,
                            },
                        });

                        console.log("/users/me/ response status:", userRes.status);
                        
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            console.log("/users/me/ data:", userData);
                            
                            const userObject = {
                                id: String(userId),
                                email: userData.email || credentials.email,
                                accessToken: access_token,
                                refreshToken: refresh_token,
                                number: userData.number,
                                first_name: userData.first_name,
                                last_name: userData.last_name,
                                phone: userData.phone,
                                profile: userData.profile,
                                roles: userData.roles,
                            };
                            
                            console.log("Returning user object:", userObject);
                            console.log("=== AUTHORIZE SUCCESS ===");
                            return userObject;
                        } else {
                            console.error("/users/me/ failed with status:", userRes.status);
                        }
                    } catch (meError) {
                        console.error("Error fetching user data:", meError);
                    }
                    
                    // Fallback
                    const fallbackUser = {
                        id: String(userId),
                        email: credentials.email,
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    };
                    console.log("Returning fallback user:", fallbackUser);
                    console.log("=== AUTHORIZE SUCCESS (FALLBACK) ===");
                    return fallbackUser;

                } catch (error : any) {
                    console.error("=== AUTHORIZE ERROR ===");
                    console.error("Authorization error:", error.message);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            console.log("=== JWT CALLBACK ===");
            console.log("Trigger:", trigger);
            console.log("User:", user ? "present" : "null");
            
            if (user) {
                console.log("Storing user in token:", {
                    id: user.id,
                    email: user.email,
                    hasAccessToken: !!user.accessToken,
                    hasRefreshToken: !!user.refreshToken,
                });
                token.id = user.id;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.number = user.number;
                token.first_name = user.first_name;
                token.last_name = user.last_name;
                token.phone = user.phone;
                token.profile = user.profile;
                token.roles = user.roles;
            }
            
            if (trigger === "update" && session?.user) {
                console.log("Updating token from session");
                token.accessToken = session.user.accessToken;
                token.refreshToken = session.user.refreshToken;
            }
            
            console.log("JWT token keys:", Object.keys(token));
            return token;
        },
        async session({ session, token }) {
            console.log("=== SESSION CALLBACK ===");
            console.log("Token keys:", Object.keys(token));
            
            if (!token) {
                console.log("No token, returning session as-is");
                return session;
            }
            
            const enrichedSession = {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken,
                    number: token.number,
                    first_name: token.first_name,
                    last_name: token.last_name,
                    phone: token.phone,
                    profile: token.profile,
                    roles: token.roles,
                },
            };
            
            console.log("Enriched session user:", {
                hasAccessToken: !!enrichedSession.user.accessToken,
                first_name: enrichedSession.user.first_name,
                roles: enrichedSession.user.roles,
            });
            
            return enrichedSession;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 60, // 30 minutes
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthOptions


