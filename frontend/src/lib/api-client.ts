import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(endpoint: string, method: "GET" | "POST" = "POST", data?: any) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let url = `${API_BASE_URL}${endpoint}`;
  let body: string | undefined;

  if (method === "GET" && data) {
    const params = new URLSearchParams();
    params.set("_input", JSON.stringify(data));
    url = `${url}?${params.toString()}`;
  } else if (data !== undefined) {
    body = JSON.stringify(data);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "An error occurred";
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function createClientFn(name: string, method: "GET" | "POST") {
  const fn = (input?: any) => apiFetch(`/api/functions/${name}`, method, input);
  return fn;
}
