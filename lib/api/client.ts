import axios from "axios";

function normalizeGraphqlHttpUrl(raw: string | undefined): string {
  const fallback = "http://localhost:4000/graphql";
  const s = (raw ?? fallback).trim() || fallback;
  const base = s.replace(/\/+$/, "");
  if (/\/graphql$/i.test(base)) return base;
  return `${base}/graphql`;
}

export const API_URL = normalizeGraphqlHttpUrl(
  process.env.NEXT_PUBLIC_GRAPHQL_URL,
);

const api = axios.create({
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

export type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await api.post<GraphqlResponse<T>>(
    API_URL,
    { query, variables },
    { headers },
  );

  if (res.data.errors?.length) {
    const msg = res.data.errors.map((e) => e.message).filter(Boolean).join(" · ");
    throw new Error(msg || "Request failed");
  }
  if (!res.data.data) throw new Error("Empty response from server");
  return res.data.data;
}

export function notifyError(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Check your connection and try again.";
    }
    if (!error.response && error.message === "Network Error") {
      return "Could not reach the room API. Is the backend running?";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
