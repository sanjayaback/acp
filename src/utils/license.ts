import { LicenseInfo, KeyDurationOption, ActivationResult } from '../types';

// System salt for signing and verifying license keys
const LICENSE_SECRET_SALT = 'ACP_KEY_SECRET_V1_2026_ENTERPRISE';
const STORAGE_KEY = 'autoclip_license_v1';

// Convert a string to a simple deterministic 32-bit hash hex (8 chars)
function computeChecksum(payload: string): string {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Also perform salt mixing
  for (let i = 0; i < LICENSE_SECRET_SALT.length; i++) {
    hash ^= LICENSE_SECRET_SALT.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Generate a new activation key with customizable expiration
 */
export function generateLicenseKey(duration: KeyDurationOption, label?: string): { key: string; expiresAt: string | null; planName: string } {
  let durCode = '30D';
  let planName = '30 Days License';
  let expiresTimestamp: number | null = null;
  const now = new Date();

  if (duration === '7d') {
    durCode = '07D';
    planName = '7 Days Pass';
    const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expiresTimestamp = Math.floor(exp.getTime() / 1000);
  } else if (duration === '30d') {
    durCode = '30D';
    planName = '30 Days License';
    const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    expiresTimestamp = Math.floor(exp.getTime() / 1000);
  } else if (duration === '90d') {
    durCode = '90D';
    planName = '90 Days Pass';
    const exp = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    expiresTimestamp = Math.floor(exp.getTime() / 1000);
  } else if (duration === '365d') {
    durCode = '365D';
    planName = '1 Year License';
    const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    expiresTimestamp = Math.floor(exp.getTime() / 1000);
  } else if (duration === 'lifetime') {
    durCode = 'LIFE';
    planName = 'Lifetime Unlimited';
    expiresTimestamp = 0xFFFFFFFF; // Max 32-bit hex timestamp
  }

  const expHex = expiresTimestamp ? expiresTimestamp.toString(16).toUpperCase().padStart(8, '0') : 'FFFFFFFF';
  
  // Random nonce to ensure unique keys even for same duration
  const randomNonce = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

  const payload = `${durCode}-${expHex}-${randomNonce}`;
  const checksum = computeChecksum(payload);

  const key = `ACP-${payload}-${checksum}`;
  const expiresAtISO = expiresTimestamp && expiresTimestamp !== 0xFFFFFFFF ? new Date(expiresTimestamp * 1000).toISOString() : null;

  return { key, expiresAt: expiresAtISO, planName };
}

/**
 * Verify and parse a license key string
 */
export function verifyLicenseKey(rawKey: string): ActivationResult {
  const cleanKey = rawKey.trim().toUpperCase();

  if (!cleanKey) {
    return { success: false, message: 'Please enter an activation key.' };
  }

  // Format check: ACP-[DUR]-[EXPHEX]-[NONCE]-[CHECKSUM]
  const parts = cleanKey.split('-');
  if (parts.length !== 5 || parts[0] !== 'ACP') {
    return { success: false, message: 'Invalid key format. Expected ACP-XXXX-XXXX-XXXX-XXXX' };
  }

  const [_, durCode, expHex, nonce, checksum] = parts;
  const payload = `${durCode}-${expHex}-${nonce}`;
  const expectedChecksum = computeChecksum(payload);

  if (checksum !== expectedChecksum) {
    return { success: false, message: 'Invalid activation key signature.' };
  }

  // Parse expiration timestamp
  const expTimestamp = parseInt(expHex, 16);
  const isLifetime = durCode === 'LIFE' || expHex === 'FFFFFFFF';

  let planName = 'Standard License';
  if (durCode === '07D') planName = '7 Days Pass';
  else if (durCode === '30D') planName = '30 Days License';
  else if (durCode === '90D') planName = '90 Days Pass';
  else if (durCode === '365D') planName = '1 Year License';
  else if (isLifetime) planName = 'Lifetime Unlimited';

  const nowMs = Date.now();
  const expMs = isLifetime ? Infinity : expTimestamp * 1000;
  const isExpired = !isLifetime && nowMs > expMs;

  let daysRemaining: number | null = null;
  if (!isLifetime && !isExpired) {
    const diffMs = expMs - nowMs;
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  if (isExpired) {
    const expDate = new Date(expMs).toLocaleDateString();
    return {
      success: false,
      message: `This key expired on ${expDate}. Please enter a new active key.`,
      license: {
        key: cleanKey,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(expMs).toISOString(),
        isLifetime: false,
        planName,
        isValid: false,
        isExpired: true,
        daysRemaining: 0,
      },
    };
  }

  const license: LicenseInfo = {
    key: cleanKey,
    activatedAt: new Date().toISOString(),
    expiresAt: isLifetime ? null : new Date(expMs).toISOString(),
    isLifetime,
    planName,
    isValid: true,
    isExpired: false,
    daysRemaining,
  };

  return {
    success: true,
    message: isLifetime ? 'Lifetime Key Activated Successfully!' : `Key Activated! Valid for ${daysRemaining} days.`,
    license,
  };
}

/**
 * Retrieve active license from local storage and re-verify expiration
 */
export function getStoredLicense(): LicenseInfo | null {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return null;

    const saved: LicenseInfo = JSON.parse(item);
    if (!saved || !saved.key) return null;

    // Re-verify key to guarantee it hasn't expired since stored
    const result = verifyLicenseKey(saved.key);
    if (result.success && result.license) {
      return result.license;
    }
    
    // If expired, return the expired status license info
    if (result.license) {
      return result.license;
    }
    return null;
  } catch (err) {
    console.error('Failed to read stored license:', err);
    return null;
  }
}

/**
 * Persist active license
 */
export function saveLicense(license: LicenseInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
  } catch (err) {
    console.error('Failed to save license:', err);
  }
}

/**
 * Remove stored license
 */
export function clearStoredLicense(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear stored license:', err);
  }
}
