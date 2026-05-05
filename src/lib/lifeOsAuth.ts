import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { getLifeOsPool } from "./lifeOsDb";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function sessionSecret() {
  const secret = process.env.LIFE_OS_SESSION_SECRET;
  if (!secret) throw new Error("Missing LIFE_OS_SESSION_SECRET");
  return secret;
}

function hashPassword(password: string, salt: string, iterations = ITERATIONS) {
  return pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha256").toString("base64");
}

function sign(payload: string) {
  return createHash("sha256").update(`${payload}.${sessionSecret()}`).digest("base64url");
}

export async function hasPassword() {
  const result = await getLifeOsPool().query("select exists(select 1 from life_os.app_auth where id=1) as exists");
  return Boolean(result.rows[0]?.exists);
}

export async function setupPassword(password: string) {
  if (password.length < 10) throw new Error("Password must be at least 10 characters");
  if (await hasPassword()) throw new Error("Password already configured");
  const salt = randomBytes(24).toString("base64");
  const passwordHash = hashPassword(password, salt);
  await getLifeOsPool().query(
    "insert into life_os.app_auth (id, password_hash, salt, iterations) values (1, $1, $2, $3)",
    [passwordHash, salt, ITERATIONS],
  );
  return createSessionToken();
}

export async function login(password: string) {
  const result = await getLifeOsPool().query("select password_hash, salt, iterations from life_os.app_auth where id=1");
  const row = result.rows[0];
  if (!row) throw new Error("Password is not configured yet");
  const computed = hashPassword(password, row.salt, Number(row.iterations));
  const stored = Buffer.from(row.password_hash, "base64");
  const candidate = Buffer.from(computed, "base64");
  if (stored.length !== candidate.length || !timingSafeEqual(stored, candidate)) {
    throw new Error("Invalid password");
  }
  return createSessionToken();
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAuthorizedHeader(header: string | null) {
  if (!(await hasPassword())) return false;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  return verifySessionToken(token);
}
