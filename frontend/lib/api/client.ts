import type { ApiErrorEnvelope } from "@/lib/types/api";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown[];

  constructor({
    message,
    code,
    status,
    details = [],
  }: {
    message: string;
    code: string;
    status: number;
    details?: unknown[];
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function buildApiUrl(path: string) {
  return new URL(path, API_BASE_URL).toString();
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorEnvelope: ApiErrorEnvelope | null = null;

    try {
      errorEnvelope = (await response.json()) as ApiErrorEnvelope;
    } catch {
      errorEnvelope = null;
    }

    throw new ApiError({
      message: errorEnvelope?.error.message ?? `Request failed with ${response.status}`,
      code: errorEnvelope?.error.code ?? "http_error",
      status: response.status,
      details: errorEnvelope?.error.details ?? [],
    });
  }

  return (await response.json()) as T;
}
