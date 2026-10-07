import test from "node:test";
import assert from "node:assert/strict";
import {
  validateSupabaseConfig,
  cleanEnvValue,
  isServiceRoleKey,
  getAuthDiagnostics,
} from "../lib/supabaseConfig.js";
import {
  mapAuthError,
  AuthConfigurationError,
} from "../lib/authErrors.js";
import { supabase, isSupabaseConfigured, authConfig } from "../lib/supabase.js";
import { getInitialProfile, defaultProfile } from "../context/CareerContextCore.js";

test("1. Missing Supabase URL detection", () => {
  const result = validateSupabaseConfig("", "anon-test-key");
  assert.equal(result.configured, false);
  assert.equal(result.urlValid, false);
  assert.equal(result.reason, "MISSING_SUPABASE_URL");
  assert.match(result.message, /VITE_SUPABASE_URL is missing/);
});

test("2. Missing Supabase anon/publishable key detection", () => {
  const result = validateSupabaseConfig("https://example.supabase.co", "");
  assert.equal(result.configured, false);
  assert.equal(result.anonKeyPresent, false);
  assert.equal(result.reason, "MISSING_SUPABASE_ANON_KEY");
  assert.match(result.message, /VITE_SUPABASE_ANON_KEY is missing/);
});

test("3. Invalid Supabase URL detection", () => {
  // Syntax error
  const syntaxCheck = validateSupabaseConfig("invalid-url-string", "valid-key");
  assert.equal(syntaxCheck.configured, false);
  assert.equal(syntaxCheck.urlValid, false);
  assert.equal(syntaxCheck.reason, "INVALID_SUPABASE_URL");

  // Insecure remote HTTP
  const httpRemoteCheck = validateSupabaseConfig("http://remote-project.supabase.co", "valid-key");
  assert.equal(httpRemoteCheck.configured, false);
  assert.equal(httpRemoteCheck.reason, "INVALID_SUPABASE_URL");
  assert.match(httpRemoteCheck.message, /HTTPS/);

  // Localhost HTTP is accepted
  const localHttpCheck = validateSupabaseConfig("http://localhost:54321", "valid-key");
  assert.equal(localHttpCheck.configured, true);
  assert.equal(localHttpCheck.isLocal, true);
});

test("4. Valid configuration detection and wrapping quote stripping", () => {
  // Valid HTTPS URL with base64 anon payload
  const validUrl = ' "https://app-project.supabase.co" ';
  const anonPayload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64");
  const validAnonKey = `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${anonPayload}.signature'`;

  const cleanedUrl = cleanEnvValue(validUrl);
  assert.equal(cleanedUrl, "https://app-project.supabase.co");

  const result = validateSupabaseConfig(validUrl, validAnonKey);
  assert.equal(result.configured, true);
  assert.equal(result.urlValid, true);
  assert.equal(result.anonKeyPresent, true);
  assert.equal(result.reason, "CONFIGURED");

  // Service role key detection
  const servicePayload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64");
  const serviceRoleKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${servicePayload}.signature`;
  assert.equal(isServiceRoleKey(serviceRoleKey), true);

  const securityCheck = validateSupabaseConfig("https://app.supabase.co", serviceRoleKey);
  assert.equal(securityCheck.configured, false);
  assert.equal(securityCheck.reason, "SERVICE_ROLE_KEY_DETECTED");
  assert.match(securityCheck.message, /service-role/i);
});

test("5. Comprehensive error-message mapping", () => {
  const unconfiguredState = {
    configured: false,
    message: "Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file and restart the Vite development server.",
  };

  // Missing configuration
  const msgConfig = mapAuthError(new Error("Failed to fetch"), unconfiguredState);
  assert.match(msgConfig, /Authentication is not configured yet/);
  assert.match(msgConfig, /restart the Vite development server/);

  // Network / fetch error with active config
  const msgNetwork = mapAuthError(new TypeError("Failed to fetch"));
  assert.match(msgNetwork, /Unable to connect to the authentication service/);

  // Supabase project unavailable (503)
  const msgUnavailable = mapAuthError({ status: 503, message: "Service Unavailable" });
  assert.match(msgUnavailable, /The authentication service is currently unavailable/);

  // Invalid API key
  const msgBadKey = mapAuthError({ status: 401, message: "Invalid API key" });
  assert.match(msgBadKey, /Invalid Supabase API key/);

  // Invalid login credentials
  const msgCreds = mapAuthError({ message: "Invalid login credentials" });
  assert.equal(msgCreds, "Email or password is incorrect.");

  // Email already registered
  const msgExists = mapAuthError({ message: "User already registered" });
  assert.equal(msgExists, "An account with this email already exists. Try signing in.");

  // Weak password
  const msgWeak = mapAuthError({ message: "Password should be at least 6 characters" });
  assert.equal(msgWeak, "Password is too weak. Please use at least 6 characters.");

  // Invalid email
  const msgEmail = mapAuthError({ message: "Unable to validate email address: invalid format" });
  assert.equal(msgEmail, "Please enter a valid email address.");

  // Email confirmation required
  const msgConfirm = mapAuthError({ message: "Email not confirmed" });
  assert.equal(msgConfirm, "Please confirm your email address before signing in.");

  // Rate limit
  const msgRate = mapAuthError({ status: 429, message: "over_email_send_rate_limit" });
  assert.equal(msgRate, "Too many attempts. Please wait a moment and try again.");

  // Session expired
  const msgExpired = mapAuthError({ message: "JWT expired" });
  assert.equal(msgExpired, "Your session has expired. Please sign in again.");
});

test("6. Login error handling with unconfigured client", async () => {
  if (!isSupabaseConfigured) {
    await assert.rejects(
      async () => {
        await supabase.auth.signInWithPassword({
          email: "test@example.com",
          password: "password123",
        });
      },
      (err) => {
        assert.ok(err instanceof AuthConfigurationError);
        const mapped = mapAuthError(err, authConfig);
        assert.match(mapped, /Authentication is not configured yet/);
        assert.doesNotMatch(mapped, /Failed to fetch/);
        return true;
      }
    );
  }
});

test("7. Signup error handling with unconfigured client", async () => {
  if (!isSupabaseConfigured) {
    await assert.rejects(
      async () => {
        await supabase.auth.signUp({
          email: "test@example.com",
          password: "password123",
        });
      },
      (err) => {
        assert.ok(err instanceof AuthConfigurationError);
        const mapped = mapAuthError(err, authConfig);
        assert.match(mapped, /Authentication is not configured yet/);
        assert.doesNotMatch(mapped, /Failed to fetch/);
        return true;
      }
    );
  }
});

test("8. Logout handling resolves cleanly", async () => {
  const result = await supabase.auth.signOut();
  assert.equal(result.error, null);
});

test("9. Unsupported / unknown auth error sanitization", () => {
  const stackError = new Error("Internal obscure db failure\n at Database.query (internal.js:12)");
  const sanitized = mapAuthError(stackError);
  assert.equal(sanitized, "An unexpected authentication error occurred. Please try again.");
  assert.doesNotMatch(sanitized, /internal\.js/);
  assert.doesNotMatch(sanitized, /Database\.query/);
});

test("10. Existing profile / localStorage compatibility", () => {
  // Mock localStorage for Node test runner
  const storage = {};
  const mockLocalStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => {
      storage[key] = String(val);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
  };
  globalThis.localStorage = mockLocalStorage;

  // Verify default profile fallback
  const initial = getInitialProfile();
  assert.equal(initial.role, defaultProfile.role);

  // Store existing custom profile data
  const sampleProfile = {
    name: "Alex Morgan",
    role: "Senior Data Scientist",
    skills: ["Python", "PyTorch", "SQL"],
  };
  mockLocalStorage.setItem("careerProfile", JSON.stringify(sampleProfile));

  const loaded = getInitialProfile();
  assert.equal(loaded.name, "Alex Morgan");
  assert.equal(loaded.role, "Senior Data Scientist");
  assert.match(loaded.skills, /PyTorch/);
});

test("Diagnostics utility returns safe summary without credentials", () => {
  const diag = getAuthDiagnostics();
  assert.equal(typeof diag.configured, "boolean");
  assert.equal(typeof diag.urlValid, "boolean");
  assert.equal(typeof diag.anonKeyPresent, "boolean");
  assert.equal(typeof diag.developerSummary, "string");
  assert.match(diag.developerSummary, /SUPABASE_CONFIG:/);
  assert.doesNotMatch(diag.developerSummary, /eyJ/);
});
