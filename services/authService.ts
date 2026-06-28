import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { assertSupabaseConfigured, supabase } from "@/services/supabase";

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google" | "apple";

const authRequestTimeout = 12000;

export async function signInWithOAuth(provider: OAuthProvider) {
  assertSupabaseConfigured();

  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await withTimeout(
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    }),
    authRequestTimeout,
    "Auth took too long to start. Check your internet connection and try again."
  );

  if (error) {
    throwAuthError(error.message);
  }

  if (!data.url) {
    throw new Error("No auth URL was returned.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    throw new Error("Authentication was cancelled.");
  }

  await completeOAuthSession(result.url);
}

export async function signUpWithEmail(email: string, password: string) {
  assertSupabaseConfigured();
  validateEmailPassword(email, password);

  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: Linking.createURL("auth/callback"),
      },
    }),
    authRequestTimeout,
    "Account creation is taking too long. Check your internet connection and try again."
  );

  if (error) {
    throwAuthError(error.message);
  }

  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  assertSupabaseConfigured();
  validateEmailPassword(email, password);

  const { error } = await withTimeout(
    supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    }),
    authRequestTimeout,
    "Sign in is taking too long. Check your internet connection and try again."
  );

  if (error) {
    throwAuthError(error.message);
  }
}

export async function signOut() {
  assertSupabaseConfigured();

  const { error } = await withTimeout(
    supabase.auth.signOut(),
    authRequestTimeout,
    "Sign out took too long. Check your connection and try again."
  );

  if (error) {
    throwAuthError(error.message);
  }
}

export async function completeOAuthSession(url: string) {
  const parsedUrl = new URL(url);
  const code = parsedUrl.searchParams.get("code");

  if (code) {
    const { error } = await withTimeout(
      supabase.auth.exchangeCodeForSession(code),
      authRequestTimeout,
      "Auth completed, but the session took too long to save. Try signing in again."
    );

    if (error) {
      throwAuthError(error.message);
    }

    return;
  }

  const hashParams = new URLSearchParams(parsedUrl.hash.replace("#", ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await withTimeout(
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
      authRequestTimeout,
      "Auth completed, but the session took too long to save. Try signing in again."
    );

    if (error) {
      throwAuthError(error.message);
    }

    return;
  }

  throw new Error("Could not complete the auth session.");
}

function validateEmailPassword(email: string, password: string) {
  if (!email.trim() || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
}

function throwAuthError(message: string): never {
  if (/network request failed|fetch failed|failed to fetch/i.test(message)) {
    throw new Error(
      "Cannot reach Supabase. Check EXPO_PUBLIC_SUPABASE_URL in .env, your internet connection, and whether the Supabase project is active."
    );
  }

  throw new Error(message);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}
