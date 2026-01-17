// SSN Encryption utilities using AES-256-GCM
// For production, use proper key management (AWS KMS, HashiCorp Vault, etc.)

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate a warning
function getEncryptionKey(): Buffer {
  const key = process.env.SSN_ENCRYPTION_KEY;

  if (!key) {
    console.warn(
      "WARNING: SSN_ENCRYPTION_KEY not set. Using derived key from AUTH_SECRET. " +
      "Set SSN_ENCRYPTION_KEY in production for better security."
    );
    // Derive a key from AUTH_SECRET as fallback
    const authSecret = process.env.AUTH_SECRET || "default-secret-change-me";
    return crypto.scryptSync(authSecret, "ssn-salt", 32);
  }

  // Key should be 32 bytes (256 bits) for AES-256
  if (key.length === 64) {
    // Hex-encoded key
    return Buffer.from(key, "hex");
  } else if (key.length === 44) {
    // Base64-encoded key
    return Buffer.from(key, "base64");
  } else {
    // Derive key from the provided string
    return crypto.scryptSync(key, "ssn-salt", 32);
  }
}

/**
 * Encrypts a Social Security Number using AES-256-GCM
 * @param ssn The SSN to encrypt (format: XXX-XX-XXXX or XXXXXXXXX)
 * @returns Encrypted SSN as a hex string (iv:authTag:ciphertext)
 */
export function encryptSSN(ssn: string): string {
  // Remove any dashes or spaces
  const cleanSSN = ssn.replace(/[-\s]/g, "");

  if (!/^\d{9}$/.test(cleanSSN)) {
    throw new Error("Invalid SSN format. Must be 9 digits.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(cleanSSN, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return as iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted SSN
 * @param encryptedSSN The encrypted SSN string (iv:authTag:ciphertext)
 * @returns The decrypted SSN (9 digits, no dashes)
 */
export function decryptSSN(encryptedSSN: string): string {
  const parts = encryptedSSN.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted SSN format");
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Gets the last 4 digits of an SSN for display purposes
 * @param ssn The SSN (can be encrypted or plain)
 * @returns Last 4 digits as string (e.g., "1234")
 */
export function getSSNLastFour(ssn: string): string {
  // If it looks like an encrypted SSN, decrypt it first
  if (ssn.includes(":")) {
    const decrypted = decryptSSN(ssn);
    return decrypted.slice(-4);
  }

  // Otherwise, just get the last 4 digits
  const cleanSSN = ssn.replace(/[-\s]/g, "");
  return cleanSSN.slice(-4);
}

/**
 * Formats an SSN for display (masked except last 4)
 * @param ssn The SSN (plain or encrypted)
 * @returns Formatted string like "***-**-1234"
 */
export function formatSSNMasked(ssn: string): string {
  const lastFour = getSSNLastFour(ssn);
  return `***-**-${lastFour}`;
}

/**
 * Validates SSN format
 * @param ssn The SSN to validate
 * @returns true if valid format
 */
export function isValidSSN(ssn: string): boolean {
  const cleanSSN = ssn.replace(/[-\s]/g, "");

  // Must be 9 digits
  if (!/^\d{9}$/.test(cleanSSN)) {
    return false;
  }

  // Cannot be all zeros or invalid patterns
  if (cleanSSN === "000000000") {
    return false;
  }

  // Area number (first 3 digits) cannot be 000, 666, or 900-999
  const area = parseInt(cleanSSN.substring(0, 3));
  if (area === 0 || area === 666 || area >= 900) {
    return false;
  }

  // Group number (middle 2 digits) cannot be 00
  const group = parseInt(cleanSSN.substring(3, 5));
  if (group === 0) {
    return false;
  }

  // Serial number (last 4 digits) cannot be 0000
  const serial = parseInt(cleanSSN.substring(5, 9));
  if (serial === 0) {
    return false;
  }

  return true;
}
