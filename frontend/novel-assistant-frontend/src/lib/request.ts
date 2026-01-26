import { config } from "@/config";
import { logger } from "@/lib/logger";
import { AppError, ErrorCodes } from "@/lib/error";

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260125-01
 * 创建时间: 2026-01-20 21:40
 * 更新时间: 2026-01-25 11:40
 * 更新记录:
 * - [2026-01-25 11:40:FE-REF-20260125-01: 对齐 v1.1 架构文档，引入 AppError，支持统一错误码处理，优化 URL 拼接逻辑。]
 */

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
  timeoutMs?: number;
  retry?: number;
  /**
   * 是否自动添加 API 前缀
   * @default true
   */
  useApiPrefix?: boolean; 
}

interface ApiResponse<T = unknown> {
  code: number;
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

// TODO: 当后端完全迁移到 /api/v1 时，将其设置为 "/api/v1"
const API_PREFIX = ""; 

/**
 * Unified Request Client
 */
async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { 
    params, 
    skipAuth, 
    timeoutMs = 15000, 
    retry = 0, 
    useApiPrefix = true,
    ...init 
  } = options;

  // Build URL
  const baseUrl = config.novel.apiBaseUrl;
  let fullUrl = url;

  if (url.startsWith("http")) {
    fullUrl = url;
  } else {
    // 拼接 BaseURL
    let path = url;
    // 如果启用前缀且 path 不以前缀开头（防止重复）
    if (useApiPrefix && API_PREFIX && !path.startsWith(API_PREFIX)) {
        // 确保 API_PREFIX 前面有 / 后面没有 / (如果 API_PREFIX 非空)
        // 简单处理: 直接拼
        path = `${API_PREFIX}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    
    // 确保 baseUrl 结尾无 /，path 开头有 /
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    fullUrl = `${cleanBase}${cleanPath}`;
  }

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

        throw new AppError(errorMessage, response.status);
      }

      if (response.status === 204) {
        return null as T;
      }

      const data: unknown = await response.json();

      // Handle Business Error
      if (isApiResponse(data)) {
        // 成功
        if (data.code === ErrorCodes.SUCCESS) {
           return data.data as T;
        }
        
        // 系统错误或业务错误
        const isSystem = data.code === ErrorCodes.SYSTEM_ERROR;
        const msg = data.message || "Business Error";
        throw new AppError(msg, data.code, null, isSystem);
      }

      // 如果后端返回的不是标准格式 (兼容旧接口或非标准接口)
      return data as T;

    } catch (error: unknown) {
      const shouldRetry = attempt + 1 < maxAttempt;
      // 如果是 AppError 且不是 5xx 系统错误，通常不重试（除非是网络错误，但这里 fetchWithTimeout 抛出的是 standard Error）
      // fetch 抛出的 TypeError (网络错误) 可以重试
      const isNetworkError = error instanceof TypeError; // fetch network error
      const isServerError = error instanceof AppError && Number(error.code) >= 500;
      
      if ((isNetworkError || isServerError) && shouldRetry) {
        attempt += 1;
        continue;
      }

      logger.error(`Request Error [${init.method || 'GET'} ${url}]:`, error);
      
      // 可以在这里做全局错误处理，比如 401 跳转登录
      if (error instanceof AppError && error.code === ErrorCodes.UNAUTHORIZED) {
          // window.location.href = '/login'; 
          // TODO: 使用事件总线或回调处理
      }

      throw AppError.fromError(error);
    }
  }

  throw new AppError("Request Failed after retries");
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

request.patch = <T>(url: string, data?: unknown, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "PATCH", body: JSON.stringify(data) });
};

request.delete = <T>(url: string, options?: RequestOptions) => {
  return request<T>(url, { ...options, method: "DELETE" });
};

export { request };
