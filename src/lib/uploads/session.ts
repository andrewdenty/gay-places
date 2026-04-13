/**
 * Session ID management for anonymous photo submissions.
 * 
 * Anonymous users are assigned a session ID that persists for the duration of
 * their browser session. This allows us to track submissions across multiple
 * uploads without requiring authentication.
 * 
 * The session ID is stored in localStorage with key 'gay-places:submission-session-id'
 * and persists across page reloads but is conceptually scoped to a single session.
 */

const SESSION_ID_KEY = "gay-places:submission-session-id";

/**
 * Generates a new UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the existing session ID or creates a new one if it doesn't exist.
 * Returns null if localStorage is not available.
 */
export function getSubmissionSessionId(): string | null {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) {
      return existing;
    }
    return null;
  } catch {
    // localStorage may not be available in some environments (e.g., during SSR)
    console.warn("Failed to access localStorage for session ID");
    return null;
  }
}

/**
 * Creates and persists a new session ID for anonymous submissions.
 * Returns null if localStorage is not available.
 */
export function createSubmissionSessionId(): string | null {
  try {
    const newId = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch {
    // localStorage may not be available in some environments (e.g., during SSR)
    console.warn("Failed to access localStorage to create session ID");
    return null;
  }
}

/**
 * Clears the session ID from storage (e.g., on logout or when user authenticates).
 */
export function clearSubmissionSessionId(): void {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch {
    console.warn("Failed to clear submission session ID");
  }
}
