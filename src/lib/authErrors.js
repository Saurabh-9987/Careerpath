/**
 * Centralized Supabase authentication error mapper.
 * Translates technical error codes and exceptions into user-friendly, safe messages.
 * Never leaks stack traces, secrets, or internal details.
 */

export class AuthConfigurationError extends Error {
  constructor(message = "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server.") {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export function mapAuthError(error, configState = null) {
  // If configuration is not set, prioritize configuration guidance
  if (configState && !configState.configured) {
    return (
      configState.message ||
      "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server."
    );
  }

  if (!error) {
    return "An unexpected authentication error occurred. Please try again.";
  }

  if (error instanceof AuthConfigurationError || error.name === "AuthConfigurationError") {
    return error.message;
  }

  const rawMessage = (
    error.message ||
    error.error_description ||
    error.description ||
    (typeof error === "string" ? error : "")
  ).toLowerCase();

  const status = error.status || error.statusCode || 0;
  const code = (error.code || "").toLowerCase();

  // 1. Missing or invalid environment configuration
  if (
    rawMessage.includes("missing vite_supabase") ||
    rawMessage.includes("authentication is not configured") ||
    code === "missing_env_vars"
  ) {
    return "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server.";
  }

  if (rawMessage.includes("invalid supabase url") || rawMessage.includes("invalid_supabase_url")) {
    return "Invalid Supabase URL configured. Please check your VITE_SUPABASE_URL in .env and restart the Vite development server.";
  }

  if (
    rawMessage.includes("service-role") ||
    rawMessage.includes("service_role") ||
    code === "service_role_key_detected"
  ) {
    return "CRITICAL SECURITY WARNING: A Supabase service-role key cannot be used on the frontend. Please replace it with the public anon key.";
  }

  // 2. Network failures / fetch failures
  if (
    rawMessage.includes("failed to fetch") ||
    rawMessage.includes("network") ||
    rawMessage.includes("fetch failed") ||
    rawMessage.includes("econnrefused") ||
    rawMessage.includes("err_connection")
  ) {
    return "Unable to connect to the authentication service. Check your internet connection and verify that your Supabase project is active.";
  }

  // 3. Supabase project unavailable / server error
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    rawMessage.includes("service unavailable") ||
    rawMessage.includes("bad gateway") ||
    rawMessage.includes("gateway timeout") ||
    rawMessage.includes("project paused") ||
    rawMessage.includes("cloudflare")
  ) {
    return "The authentication service is currently unavailable. Please verify your Supabase project status or try again later.";
  }

  // 4. Session expired
  if (
    rawMessage.includes("session expired") ||
    rawMessage.includes("jwt expired") ||
    rawMessage.includes("token expired") ||
    rawMessage.includes("refresh_token_not_found")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  // 5. Invalid API key / 401 Unauthorized
  if (
    rawMessage.includes("invalid api key") ||
    rawMessage.includes("invalid api_key") ||
    rawMessage.includes("invalid apikey") ||
    rawMessage.includes("invalid jwt") ||
    rawMessage.includes("bad_jwt") ||
    (status === 401 && !rawMessage.includes("credential"))
  ) {
    return "Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY in .env and restart the Vite development server.";
  }

  // 5. Invalid login credentials
  if (
    rawMessage.includes("invalid login credentials") ||
    rawMessage.includes("invalid credentials") ||
    rawMessage.includes("invalid_grant") ||
    rawMessage.includes("wrong password") ||
    rawMessage.includes("user not found")
  ) {
    return "Email or password is incorrect.";
  }

  // 6. Email already registered
  if (
    rawMessage.includes("user already registered") ||
    rawMessage.includes("already registered") ||
    rawMessage.includes("already exists") ||
    rawMessage.includes("user_already_exists")
  ) {
    return "An account with this email already exists. Try signing in.";
  }

  // 7. Weak password
  if (
    rawMessage.includes("weak password") ||
    rawMessage.includes("password should be at least") ||
    rawMessage.includes("password is too short") ||
    rawMessage.includes("pwned")
  ) {
    return "Password is too weak. Please use at least 6 characters.";
  }

  // 8. Invalid email
  if (
    rawMessage.includes("invalid email") ||
    rawMessage.includes("unable to validate email") ||
    rawMessage.includes("valid email")
  ) {
    return "Please enter a valid email address.";
  }

  // 9. Email confirmation required
  if (
    rawMessage.includes("email not confirmed") ||
    rawMessage.includes("confirm your email") ||
    rawMessage.includes("email confirmation")
  ) {
    return "Please confirm your email address before signing in.";
  }

  // 10. Rate limiting / too many requests
  if (
    status === 429 ||
    rawMessage.includes("rate limit") ||
    rawMessage.includes("too many requests") ||
    rawMessage.includes("over_email_send_rate_limit")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // 11. Session expired
  if (
    rawMessage.includes("session expired") ||
    rawMessage.includes("jwt expired") ||
    rawMessage.includes("refresh_token_not_found")
  ) {
    return "Your session has expired. Please sign in again.";
  }

  // 12. Fallback: Return safe message if clean, else generic friendly error
  const sanitized = String(error.message || "").trim();
  if (sanitized && !sanitized.includes("\n") && !sanitized.includes(" at ") && sanitized.length < 120) {
    return sanitized;
  }

  return "An unexpected authentication error occurred. Please try again.";
}
