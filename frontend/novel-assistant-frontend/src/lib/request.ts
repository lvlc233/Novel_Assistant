import { config } from "@/config";
import { logger } from "@/lib/logger";

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-20 21:40
 * 更新记录:
 * - [2026-01-20 21:40:FE-REF-20260120-01: 在何处使用: src/services/*.ts 的 request.* 调用；如何使用: request.get/post/put/delete；实现概述: 增加超时/重试选项、移除 any 与直接 console，统一错误解析与抛出。]
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
  timeoutMs?: number;
  retry?: number;
}

interface ApiResponse<T = unknown> {
  code: number | string;
  message: string;
  data: T;
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return "code" in record && "message" in record && "data" in record;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unified Request Client
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth, timeoutMs = 15000, retry = 0, ...init } = options;

  // Build URL
  const baseUrl = config.novel.apiBaseUrl;
  let fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  // Handle Query Params
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const connector = fullUrl.includes("?") ? "&" : "?";
    fullUrl += `${connector}${searchParams.toString()}`;
  }

  // Default Headers
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Token
  if (!skipAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let attempt = 0;
  const maxAttempt = Math.max(0, retry) + 1;

  while (attempt < maxAttempt) {
    try {
      const response = await fetchWithTimeout(
        fullUrl,
        {
          ...init,
          headers,
        },
        timeoutMs
      );

      // Handle HTTP Error
      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData: unknown = await response.json();
          if (errorData && typeof errorData === "object" && "message" in (errorData as Record<string, unknown>)) {
            const msg = (errorData as Record<string, unknown>).message;
            if (typeof msg === "string" && msg.trim()) errorMessage = msg;
          }
        } catch {
          // ignore
        }

        const shouldRetry = response.status >= 500 && attempt + 1 < maxAttempt;
        if (shouldRetry) {
          attempt += 1;
          continue;
        }

        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as T;
      }

      const data: unknown = await response.json();

      // Handle Business Error
      // Compatible with both string and number '200'
      if (isApiResponse(data)) {
        if (String(data.code) !== "200") {
          throw new Error(typeof data.message === "string" && data.message.trim() ? data.message : "Business Error");
        }
        return data.data as T;
      }

      return data as T;
    } catch (error: unknown) {
      const shouldRetry = attempt + 1 < maxAttempt;
      if (shouldRetry) {
        attempt += 1;
        continue;
      }

      logger.error("Request Error:", error);
      throw error;
    }
  }

  throw new Error("Request Error")
}

// Helper methods
request.get = <T>(url: string, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "GET" });
};

request.post = <T>(url: string, data?: unknown, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "POST", body: JSON.stringify(data) });
};

request.put = <T>(url: string, data?: unknown, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "PUT", body: JSON.stringify(data) });
};

request.delete = <T>(url: string, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "DELETE" });
};

export { request };
