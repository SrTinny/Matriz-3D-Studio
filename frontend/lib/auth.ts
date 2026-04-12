import axios from "axios";
import { api } from "./api";
import {
  clearCachedAuthUser,
  getCachedAuthUser,
  setCachedAuthUser,
  type AuthUser,
} from "./auth-store";

let inFlightSessionRequest: Promise<AuthUser | null> | null = null;

export async function hydrateSession(force = false): Promise<AuthUser | null> {
  const cached = getCachedAuthUser();

  if (!force && cached !== undefined) {
    return cached;
  }

  if (!force && inFlightSessionRequest) {
    return inFlightSessionRequest;
  }

  inFlightSessionRequest = api
    .get<{ user: AuthUser }>("/auth/me", {
      _skipAuthRedirect: true,
      _skipAuthRefresh: true,
    })
    .then((response) => {
      const user = response.data?.user ?? null;
      setCachedAuthUser(user);
      return user;
    })
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearCachedAuthUser();
        return null;
      }

      throw error;
    })
    .finally(() => {
      inFlightSessionRequest = null;
    });

  return inFlightSessionRequest;
}

export function getCurrentUser() {
  return getCachedAuthUser();
}

export function setCurrentUser(user: AuthUser | null) {
  setCachedAuthUser(user);
}

export function isAuthenticated(): boolean {
  return getCachedAuthUser() != null;
}

export function isAdmin(): boolean {
  return getCachedAuthUser()?.role === "ADMIN";
}

export async function logout() {
  try {
    await api.post("/auth/logout", undefined, {
      _skipAuthRefresh: true,
      _skipAuthRedirect: true,
    });
  } catch {
    // Limpeza local deve acontecer mesmo se o backend já invalidou a sessão.
  } finally {
    clearCachedAuthUser();
  }
}
