import { createCipheriv, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TWITCH_CLIENT_ID",
  "TWITCH_CLIENT_SECRET",
  "TOKEN_ENCRYPTION_KEY",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

const FIXED_TOKEN_ROW_ID = "d8a84af6-eb48-4569-ba8c-ae8835e5a3b2";

function encryptToken(plaintext, hexKey) {
  const key = Buffer.from(hexKey, "hex");

  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

async function getAppToken() {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitch token request failed: ${res.status} ${body}`);
  }

  return res.json();
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tokenPayload = await getAppToken();
  const { access_token, expires_in, token_type } = tokenPayload;
  const encrypted = encryptToken(access_token, process.env.TOKEN_ENCRYPTION_KEY);

  const { error } = await supabase.from("twitch_app_token").upsert(
    {
      id: FIXED_TOKEN_ROW_ID,
      access_token,
      access_token_ciphertext: encrypted.ciphertext,
      access_token_iv: encrypted.iv,
      access_token_tag: encrypted.authTag,
      expires_in,
      token_type,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  console.log("Seeded twitch_app_token row:", FIXED_TOKEN_ROW_ID);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
