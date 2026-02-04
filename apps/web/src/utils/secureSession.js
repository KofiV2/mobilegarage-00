/**
 * Secure Session Management Utility
 *
 * Provides cryptographic session signing and password hashing
 * to prevent session hijacking and plaintext credential storage.
 */

// Session signing secret - should be set via environment variable
const getSessionSecret = () => {
  const secret = import.meta.env.VITE_SESSION_SECRET;
  if (!secret) {
    console.error('VITE_SESSION_SECRET not configured. Using fallback (INSECURE IN PRODUCTION).');
    // In development, use a fallback. In production, this should fail.
    if (import.meta.env.MODE === 'production') {
      throw new Error('VITE_SESSION_SECRET must be configured in production');
    }
    return 'dev-only-fallback-secret-do-not-use-in-production';
  }
  return secret;
};

/**
 * Convert string to ArrayBuffer for Web Crypto API
 */
const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

/**
 * Convert ArrayBuffer to hex string
 */
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {Promise<string>} Hex-encoded signature
 */
const generateHMAC = async (data, secret) => {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToArrayBuffer(data)
  );

  return arrayBufferToHex(signature);
};

/**
 * Hash password using SHA-256 with salt
 * Note: For production, consider using a proper password hashing library like bcrypt
 * via a backend API. This is a client-side improvement over plaintext.
 * @param {string} password - Password to hash
 * @param {string} salt - Salt value (use email or unique identifier)
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password, salt) => {
  const data = `${salt}:${password}`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(data));
  return arrayBufferToHex(hashBuffer);
};

/**
 * Verify password against stored hash
 * @param {string} password - Password to verify
 * @param {string} salt - Salt used during hashing
 * @param {string} storedHash - Previously stored hash
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (password, salt, storedHash) => {
  const computedHash = await hashPassword(password, salt);
  // Constant-time comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Create a signed session token
 * @param {Object} sessionData - Session data to store
 * @returns {Promise<string>} Signed session token (base64 encoded)
 */
export const createSignedSession = async (sessionData) => {
  const secret = getSessionSecret();
  const payload = JSON.stringify(sessionData);
  const signature = await generateHMAC(payload, secret);

  // Combine payload and signature
  const token = {
    payload: sessionData,
    signature,
    createdAt: Date.now()
  };

  return btoa(JSON.stringify(token));
};

/**
 * Verify and decode a signed session token
 * @param {string} token - Signed session token
 * @returns {Promise<Object|null>} Session data if valid, null if invalid
 */
export const verifySignedSession = async (token) => {
  if (!token) return null;

  try {
    const secret = getSessionSecret();
    const decoded = JSON.parse(atob(token));

    if (!decoded.payload || !decoded.signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = await generateHMAC(
      JSON.stringify(decoded.payload),
      secret
    );

    // Constant-time comparison
    if (decoded.signature.length !== expectedSignature.length) return null;
    let result = 0;
    for (let i = 0; i < decoded.signature.length; i++) {
      result |= decoded.signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (result !== 0) {
      console.warn('Session signature verification failed - possible tampering');
      return null;
    }

    return decoded.payload;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
};

/**
 * Store session securely in localStorage with signing
 * @param {string} key - Storage key
 * @param {Object} data - Session data
 */
export const storeSecureSession = async (key, data) => {
  const signedToken = await createSignedSession(data);
  localStorage.setItem(key, signedToken);
};

/**
 * Retrieve and verify session from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<Object|null>} Session data if valid
 */
export const getSecureSession = async (key) => {
  const token = localStorage.getItem(key);
  if (!token) return null;

  const session = await verifySignedSession(token);
  if (!session) {
    // Invalid session - remove it
    localStorage.removeItem(key);
    return null;
  }

  return session;
};

/**
 * Remove session from localStorage
 * @param {string} key - Storage key
 */
export const removeSecureSession = (key) => {
  localStorage.removeItem(key);
};

/**
 * Check if session is expired
 * @param {Object} session - Session object with expiry field
 * @returns {boolean} True if expired
 */
export const isSessionExpired = (session) => {
  if (!session || !session.expiry) return true;
  return Date.now() >= session.expiry;
};

/**
 * Generate a random session ID
 * @returns {string} Random session ID
 */
export const generateSessionId = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToHex(array.buffer);
};

export default {
  hashPassword,
  verifyPassword,
  createSignedSession,
  verifySignedSession,
  storeSecureSession,
  getSecureSession,
  removeSecureSession,
  isSessionExpired,
  generateSessionId
};
