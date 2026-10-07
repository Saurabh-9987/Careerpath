import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseEnv,
  validateSupabaseConfig,
  getAuthDiagnostics,
} from "./supabaseConfig.js";
import { AuthConfigurationError } from "./authErrors.js";

const { url, anonKey } = getSupabaseEnv();
export const authConfig = validateSupabaseConfig(url, anonKey);
export const isSupabaseConfigured = authConfig.configured;

function createInertAuthClient(config) {
  const unconfiguredError = new AuthConfigurationError(config.message);

  return {
    signUp: async () => {
      throw unconfiguredError;
    },
    signInWithPassword: async () => {
      throw unconfiguredError;
    },
    signOut: async () => {
      return { error: null };
    },
    getSession: async () => {
      return { data: { session: null }, error: null };
    },
    getUser: async () => {
      return { data: { user: null }, error: null };
    },
    onAuthStateChange: () => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : {
      auth: createInertAuthClient(authConfig),
      from: () => {
        throw new AuthConfigurationError(authConfig.message);
      },
      rpc: () => {
        throw new AuthConfigurationError(authConfig.message);
      },
    };

export { getAuthDiagnostics };
