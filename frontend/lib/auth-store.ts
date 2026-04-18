export type SelectedAddressSummary = {
  id: string;
  label: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive?: boolean;
  selectedAddress?: SelectedAddressSummary | null;
};

export const AUTH_CHANGED_EVENT = 'auth:changed';
const AUTH_SESSION_HINT_KEY = 'matriz3dstudio:auth:session-hint';

let cachedAuthUser: AuthUser | null | undefined;

function canUseLocalStorage() {
  return typeof window !== 'undefined';
}

export function hasAuthSessionHint() {
  if (!canUseLocalStorage()) return false;
  try {
    return localStorage.getItem(AUTH_SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAuthSessionHint(enabled: boolean) {
  if (!canUseLocalStorage()) return;
  try {
    if (enabled) localStorage.setItem(AUTH_SESSION_HINT_KEY, '1');
    else localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getCachedAuthUser() {
  return cachedAuthUser;
}

export function setCachedAuthUser(user: AuthUser | null) {
  cachedAuthUser = user;
  setAuthSessionHint(Boolean(user));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AuthUser | null>(AUTH_CHANGED_EVENT, { detail: user }));
  }
}

export function clearCachedAuthUser() {
  setCachedAuthUser(null);
}