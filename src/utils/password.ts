const ITERATIONS = 100_000; // Cloudflare Workers max limit
const HASH_ALGORITHM = "SHA-256";
const KEY_LENGTH = 256; // bits

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // @ts-ignore - CF Worker WebCrypto typings conflict with standard TS DOM typings for BufferSource
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH,
  );
}

/**
 * Hash a password with a random salt using PBKDF2.
 * Returns base64-encoded hash and salt for storage.
 */
export async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashBuffer = await deriveKey(password, salt);

  return {
    hash: toBase64(hashBuffer),
    salt: toBase64(salt.buffer as ArrayBuffer),
  };
}

/**
 * Verify a password against a stored hash and salt.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const salt = fromBase64(storedSalt);
  const hashBuffer = await deriveKey(password, salt);
  const computedHash = toBase64(hashBuffer);

  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}
