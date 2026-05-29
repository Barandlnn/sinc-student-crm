import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
          ? body.error
          : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}

export const apiClient = {
  getMe: () => apiRequest("/me"),

  getDashboard: () => apiRequest("/dashboard"),

  getClients: () => apiRequest("/clients"),

  getClientById: (id: string) => apiRequest(`/clients/${id}`),

  getConversations: () => apiRequest("/conversations"),

  getDeals: () => apiRequest("/deals"),

  getDealById: (id: string) => apiRequest(`/deals/${id}`),
};