import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { type SafeUser, type User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  app.use(session({
    secret: process.env.SESSION_SECRET || "jessica-geldi-secret-2026",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return done(null, false, { message: "Identifiants invalides" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    if (typeof req.body?.username === "string") {
      req.body.username = req.body.username.trim();
    }
    if (typeof req.body?.password === "string") {
      req.body.password = req.body.password.trim();
    }

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info?: { message?: string }) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({
          message: info?.message || "Identifiants invalides",
        });
      }

      req.login(user, (loginError) => {
        if (loginError) {
          return next(loginError);
        }

        if (!req.user) {
          return next(new Error("Session utilisateur introuvable"));
        }

        return res.json(toSafeUser(req.user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);

      req.session.destroy((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }

        res.clearCookie("connect.sid");
        return res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(toSafeUser(req.user));
  });
}

function toSafeUser(user: SelectUser): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

const LEGACY_ADMIN_USERNAME = "admin";

/*
 * Compte admin : admin-jg / LoveJG2026 par défaut (surchargeables par ADMIN_USERNAME / ADMIN_PASSWORD).
 * L'ancien compte « admin » est renommé plutôt que dupliqué, pour que l'ancien identifiant ne fonctionne plus.
 * Une fois le compte en place, le mot de passe n'est plus réécrit au démarrage : un changement fait depuis
 * l'admin (Compte & sauvegarde) est conservé.
 */
export async function ensureAdminUser() {
  const username = process.env.ADMIN_USERNAME || "admin-jg";
  const password = process.env.ADMIN_PASSWORD || "LoveJG2026";

  const existingUser = await storage.getUserByUsername(username);
  if (existingUser) {
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const legacyUser = username !== LEGACY_ADMIN_USERNAME ? await storage.getUserByUsername(LEGACY_ADMIN_USERNAME) : undefined;
  if (legacyUser) {
    return storage.updateUserAccount(legacyUser.id, username, hashedPassword);
  }

  return storage.createUser({
    username,
    password: hashedPassword,
    firstName: "Jessica",
    lastName: "Admin",
  });
}
