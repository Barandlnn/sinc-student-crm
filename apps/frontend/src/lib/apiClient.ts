import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `API request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

// Eski sayfalar hâlâ apiRequest kullandığı için bunu alias olarak bırakıyoruz.
export const apiRequest = apiFetch;