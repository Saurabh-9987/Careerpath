/**
 * Centralized Supabase configuration validator and diagnostic helper.
 * Strictly adheres to security guidelines: NEVER exposes secrets or keys.
 */

export function cleanEnvValue(val) {
  if (typeof val !== "string") return "";
  let trimmed = val.trim();
  // Remove wrapping single or double quotes if accidentally present in .env
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function isServiceRoleKey(key) {
  if (!key || typeof key !== "string") return false;
  const cleaned = cleanEnvValue(key);
  if (cleaned.toLowerCase().includes("service_role")) return true;

  try {
    const parts = cleaned.split(".");
    if (parts.length === 3) {
      // Decode base64 payload safely
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded =
        typeof atob === "function"
          ? atob(payloadBase64)
          : typeof Buffer !== "undefined"
          ? Buffer.from(payloadBase64, "base64").toString("utf-8")
          : "";
      if (
        decoded.includes('"role":"service_role"') ||
        decoded.includes('"role": "service_role"')
      ) {
        return true;
      }
    }
  } catch {
    // Non-decodable payload
  }

  return false;
}

export function validateUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") {
    return { valid: false, isLocal: false, reason: "URL is empty." };
  }

  const cleaned = cleanEnvValue(urlStr);
  try {
    const parsed = new URL(cleaned);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        isLocal,
        reason: "URL protocol must be HTTP or HTTPS.",
      };
    }

    if (!isLocal && parsed.protocol !== "https:") {
      return {
        valid: false,
        isLocal,
        reason: "Remote Supabase projects must use HTTPS.",
      };
    }

    return { valid: true, isLocal, origin: parsed.origin };
  } catch {
    return { valid: false, isLocal: false, reason: "URL syntax is invalid." };
  }
}

export function validateSupabaseConfig(rawUrl, rawKey) {
  const url = cleanEnvValue(rawUrl);
  const key = cleanEnvValue(rawKey);

  const missingUrl = !url;
  const missingKey = !key;

  if (missingUrl && missingKey) {
    return {
      configured: false,
      urlValid: false,
      anonKeyPresent: false,
      isLocal: false,
      reason: "MISSING_ENV_VARS",
      message:
        "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server.",
    };
  }

  if (missingUrl) {
    return {
      configured: false,
      urlValid: false,
      anonKeyPresent: true,
      isLocal: false,
      reason: "MISSING_SUPABASE_URL",
      message:
        "VITE_SUPABASE_URL is missing. Add VITE_SUPABASE_URL to your .env file and restart the Vite development server.",
    };
  }

  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) {
    return {
      configured: false,
      urlValid: false,
      anonKeyPresent: !missingKey,
      isLocal: urlCheck.isLocal,
      reason: "INVALID_SUPABASE_URL",
      message: `Invalid VITE_SUPABASE_URL: ${urlCheck.reason} Check your .env file and restart the Vite development server.`,
    };
  }

  if (missingKey) {
    return {
      configured: false,
      urlValid: true,
      anonKeyPresent: false,
      isLocal: urlCheck.isLocal,
      reason: "MISSING_SUPABASE_ANON_KEY",
      message:
        "VITE_SUPABASE_ANON_KEY is missing. Add VITE_SUPABASE_ANON_KEY to your .env file and restart the Vite development server.",
    };
  }

  if (isServiceRoleKey(key)) {
    return {
      configured: false,
      urlValid: true,
      anonKeyPresent: true,
      isLocal: urlCheck.isLocal,
      reason: "SERVICE_ROLE_KEY_DETECTED",
      message:
        "CRITICAL SECURITY WARNING: The provided key appears to be a Supabase service-role secret key. Never expose service-role keys in frontend code. Use the public anon key instead.",
    };
  }

  return {
    configured: true,
    urlValid: true,
    anonKeyPresent: true,
    isLocal: urlCheck.isLocal,
    reason: "CONFIGURED",
    message: "Supabase authentication is configured.",
  };
}

export function getSupabaseEnv() {
  const env =
    (typeof import.meta !== "undefined" && import.meta.env) ||
    (typeof process !== "undefined" && process.env) ||
    {};

  return {
    url: cleanEnvValue(env.VITE_SUPABASE_URL),
    anonKey: cleanEnvValue(env.VITE_SUPABASE_ANON_KEY),
  };
}

export function getAuthDiagnostics() {
  const { url, anonKey } = getSupabaseEnv();
  const validation = validateSupabaseConfig(url, anonKey);

  return {
    configured: validation.configured,
    urlValid: validation.urlValid,
    anonKeyPresent: validation.anonKeyPresent,
    isLocal: validation.isLocal,
    reason: validation.reason,
    message: validation.message,
    developerSummary: `SUPABASE_CONFIG:\nconfigured: ${validation.configured}\nurlValid: ${validation.urlValid}\nanonKeyPresent: ${validation.anonKeyPresent}\nisLocal: ${validation.isLocal}\nreason: ${validation.reason}`,
  };
}
