// frontend/lib/api.ts
import axios, { AxiosError } from "axios";
import { clearCachedAuthUser } from "./auth-store";

declare module "axios" {
  export interface AxiosRequestConfig {
    _retryCount?: number;
    _retryAuth?: boolean;
    _skipAuthRefresh?: boolean;
    _skipAuthRedirect?: boolean;
  }
}

/** Normaliza URL e remove barras finais; sem tocar em window no build */
function normalizeBaseURL(url?: string | null) {
  const raw = (url ?? "").trim();
  if (!raw) return undefined;           // undefined => Axios usa a origem no browser
  return raw.replace(/\/+$/, "");       // remove barras à direita
}

const BASE_URL = normalizeBaseURL(process.env.NEXT_PUBLIC_API_URL);
const CSRF_COOKIE_NAME = "ux_csrf";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const found = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!found) return null;
  return decodeURIComponent(found.slice(name.length + 1));
}

function getRequestPath(url?: string) {
  if (!url) return "";

  try {
    return new URL(url, BASE_URL ?? "http://localhost").pathname;
  } catch {
    return url.split("?")[0] ?? "";
  }
}

function isUnsafeMethod(method?: string) {
  const normalized = method?.toUpperCase() ?? "GET";
  return normalized === "POST" || normalized === "PUT" || normalized === "PATCH" || normalized === "DELETE";
}

function isPublicAuthRequest(url?: string) {
  const path = getRequestPath(url);
  return path === "/auth/login" || path === "/auth/register" || path.startsWith("/auth/activate/");
}

function shouldSkipRefresh(url?: string) {
  const path = getRequestPath(url);
  return isPublicAuthRequest(path) || path === "/auth/refresh" || path === "/auth/logout";
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.href = "/login";
}

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000, // ↑ tolera cold start do Render (pode deixar 60_000 se quiser)
  withCredentials: true,
});

// ===== CSRF header =====
api.interceptors.request.use((config) => {
  config.withCredentials = true;

  if (isUnsafeMethod(config.method)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    config.headers = config.headers ?? {};
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

// ===== Retry simples para timeout/network errors =====
const MAX_RETRIES = 3;
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const cfg = (error.config ?? {}) as import("axios").AxiosRequestConfig;
    const status = error.response?.status;
    const path = getRequestPath(cfg.url);

    if (status === 401 && isPublicAuthRequest(path)) {
      return Promise.reject(error);
    }

    if (status === 401 && !cfg._skipAuthRefresh && !cfg._retryAuth && !shouldSkipRefresh(path)) {
      cfg._retryAuth = true;

      try {
        const csrfToken = readCookie(CSRF_COOKIE_NAME);
        await refreshClient.post(
          "/auth/refresh",
          undefined,
          {
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
            _skipAuthRefresh: true,
            _skipAuthRedirect: true,
          },
        );

        return api(cfg);
      } catch {
        clearCachedAuthUser();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:expired"));
        }
        if (!cfg._skipAuthRedirect) {
          redirectToLogin();
        }
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      clearCachedAuthUser();
      if (!cfg._skipAuthRedirect) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    const isTimeout = error.code === "ECONNABORTED";   // timeout do axios
    const noResponse = !error.response;               // DNS, rede, CORS, etc.
    const shouldRetryStatus = status === 429; // apenas limite de taxa

    if ((isTimeout || noResponse || shouldRetryStatus) && (cfg._retryCount ?? 0) < MAX_RETRIES) {
      cfg._retryCount = (cfg._retryCount ?? 0) + 1;

      // backoff exponencial: 400ms, 800ms, 1600ms...
      const delay = 400 * 2 ** (cfg._retryCount - 1);
      await new Promise((r) => setTimeout(r, delay));

      return api(cfg);
    }

    return Promise.reject(error);
  },
);
