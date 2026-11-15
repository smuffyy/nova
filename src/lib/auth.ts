import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db, type User, type Workspace } from "./db";

const SESSION_COOKIE = "portal_session";

export function hashPassword(password: string): string {
  const salt = process.env.PORTAL_SESSION_SECRET || "portal-dev-secret";
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const next = hashPassword(password);
  try {
    return timingSafeEqual(Buffer.from(next), Buffer.from(hash));
  } catch {
    return false;
  }
}

type SessionPayload = {
  userId: string;
  workspaceId: string;
  token: string;
};

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeSession(value: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function createSession(userId: string, workspaceId: string) {
  const payload: SessionPayload = {
    userId,
    workspaceId,
    token: randomBytes(16).toString("hex"),
  };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{
  user: User;
  workspace: Workspace;
} | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = decodeSession(raw);
  if (!payload) return null;

  const user = db.getUserById(payload.userId);
  const workspace = db.getWorkspaceById(payload.workspaceId);
  if (!user || !workspace) return null;
  if (!db.getMembership(user.id, workspace.id)) return null;

  return { user, workspace };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
