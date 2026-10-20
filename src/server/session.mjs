import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
export function config(env = process.env) {
  const production = env.NODE_ENV === "production";
  const api = new URL(env.API_URL || "http://127.0.0.1:3001");
  const origin = new URL(env.APP_ORIGIN || "http://localhost:3000");
  if (
    api.origin !== env.API_URL ||
    origin.origin !== env.APP_ORIGIN ||
    api.username ||
    api.password ||
    !["http:", "https:"].includes(api.protocol) ||
    !["http:", "https:"].includes(origin.protocol) ||
    (production && (api.protocol !== "https:" || origin.protocol !== "https:"))
  )
    throw new Error(
      "API_URL e APP_ORIGIN devem ser origens exatas, HTTPS em produção.",
    );
  const secret = env.SESSION_SECRET || "";
  if (secret.length < 32)
    throw new Error("SESSION_SECRET exige pelo menos 32 caracteres.");
  const slug = env.COMPANY_SLUG || "";
  if (!/^[a-z0-9-]{1,60}$/.test(slug))
    throw new Error("COMPANY_SLUG inválido.");
  return {
    api: api.origin,
    origin: origin.origin,
    slug,
    production,
    key: createHash("sha256").update(secret).digest(),
  };
}
export function seal(value, c) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", c.key, iv);
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify({ ...value, binding: c.api + "/" + c.slug })),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64url");
}
export function unseal(raw, c) {
  try {
    const data = Buffer.from(raw || "", "base64url"),
      decipher = createDecipheriv("aes-256-gcm", c.key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const value = JSON.parse(
      Buffer.concat([
        decipher.update(data.subarray(28)),
        decipher.final(),
      ]).toString(),
    );
    return value.binding === c.api + "/" + c.slug &&
      value.expires > Date.now() &&
      /^[A-Za-z0-9_-]{43}$/.test(value.token)
      ? value
      : null;
  } catch {
    return null;
  }
}
export function allowed(method, path) {
  const uuid = "[0-9a-fA-F-]{36}";
  const rules = {
    GET: [
      /^me$/,
      /^products$/,
      /^sales$/,
      /^dashboard$/,
      /^audit$/,
      /^users$/,
      new RegExp("^sales/" + uuid + "$"),
    ],
    POST: [
      /^logout$/,
      /^products$/,
      /^sales$/,
      /^logo$/,
      /^users$/,
      new RegExp("^sales/" + uuid + "/cancel$"),
      new RegExp("^users/" + uuid + "/invite$"),
    ],
    PATCH: [
      /^settings$/,
      new RegExp("^products/" + uuid + "$"),
      new RegExp("^users/" + uuid + "$"),
    ],
  };
  return (rules[method] || []).some((r) => r.test(path));
}
