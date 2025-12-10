import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Configure Passport Local Strategy
export function setupAuth(app: Express) {
    // Local strategy for username/password authentication
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);

                if (!user) {
                    return done(null, false, { message: "Incorrect username or password" });
                }

                const isValidPassword = await bcrypt.compare(password, user.password);

                if (!isValidPassword) {
                    return done(null, false, { message: "Incorrect username or password" });
                }

                // Don't include password in the user object
                const { password: _, ...userWithoutPassword } = user;
                return done(null, userWithoutPassword);
            } catch (error) {
                return done(error);
            }
        })
    );

    // Serialize user to session
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUserById(id);
            if (!user) {
                return done(null, false);
            }
            // Don't include password
            const { password: _, ...userWithoutPassword } = user;
            done(null, userWithoutPassword);
        } catch (error) {
            done(error);
        }
    });

    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "Authentication required" });
}

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}
