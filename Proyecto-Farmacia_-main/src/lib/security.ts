type LoginAttempt = {
  count: number;
  lockedUntil: number | null;
};

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_TIME_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, LoginAttempt>();

export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\bon\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<script\b/gi, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--/g, "")
    .replace(/['";]/g, "")
    .replace(/\bxp_\w*/gi, "")
    .replace(/\b(EXEC|SELECT|DROP|INSERT|UPDATE|DELETE|UNION)\b/gi, "")
    .trim();
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;

  const emailRegex =
    /^[A-Za-z0-9.!#$%&*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

  if (!emailRegex.test(email)) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || localPart.length > 64) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;

  return true;
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "La contraseña debe incluir al menos una letra mayúscula." };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "La contraseña debe incluir al menos un número." };
  }

  return { valid: true, message: "" };
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  waitSeconds: number;
} {
  const normalizedKey = key.toLowerCase();
  const attempt = loginAttempts.get(normalizedKey);

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, waitSeconds: 0 };
  }

  if (attempt.lockedUntil) {
    const waitMs = attempt.lockedUntil - Date.now();
    if (waitMs > 0) {
      return {
        allowed: false,
        remainingAttempts: 0,
        waitSeconds: Math.ceil(waitMs / 1000),
      };
    }

    loginAttempts.delete(normalizedKey);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, waitSeconds: 0 };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - attempt.count),
    waitSeconds: 0,
  };
}

export function recordFailedAttempt(key: string): void {
  const normalizedKey = key.toLowerCase();
  const current = loginAttempts.get(normalizedKey) ?? { count: 0, lockedUntil: null };
  const nextCount = current.count + 1;

  loginAttempts.set(normalizedKey, {
    count: nextCount,
    lockedUntil: nextCount >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_TIME_MS : null,
  });
}

export function resetAttempts(key: string): void {
  loginAttempts.delete(key.toLowerCase());
}
