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

let cachedAuthUser: AuthUser | null | undefined;

export function getCachedAuthUser() {
  return cachedAuthUser;
}

export function setCachedAuthUser(user: AuthUser | null) {
  cachedAuthUser = user;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AuthUser | null>(AUTH_CHANGED_EVENT, { detail: user }));
  }
}

export function clearCachedAuthUser() {
  setCachedAuthUser(null);
}