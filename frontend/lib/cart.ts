import { api } from './api';

const GUEST_KEY = 'guest_cart_items';

type GuestItem = { productId: string; quantity: number };

export function getGuestCart(): GuestItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as GuestItem[]) : [];
  } catch {
    return [];
  }
}

export function addGuestItem(productId: string, quantity = 1) {
  if (typeof window === 'undefined') return;
  const items = getGuestCart();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    items[idx].quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_KEY);
}

/**
 * Merge guest cart to server cart using the authenticated cookie session managed by the API client.
 * Returns true if all items were posted successfully.
 */
export async function mergeGuestCartToServer(): Promise<boolean> {
  const items = getGuestCart();
  if (items.length === 0) return true;
  try {
    for (const it of items) {
      await api.post('/cart/items', { productId: it.productId, quantity: it.quantity });
    }
    clearGuestCart();
    return true;
  } catch {
    return false;
  }
}
