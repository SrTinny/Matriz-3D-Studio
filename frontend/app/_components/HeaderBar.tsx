"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser, hydrateSession, logout } from "@/lib/auth";
import { AUTH_CHANGED_EVENT, type AuthUser } from "@/lib/auth-store";
import { api } from '@/lib/api';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import BottomNavBar from './BottomNavBar';
import { CartIcon } from '@/app/_components/Icons';
// clsx not used here; navigation components handle conditional classes
import { useRouter, useSearchParams } from 'next/navigation';

export default function HeaderBar() {
  const [authed, setAuthed] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false); // menu mobile
  const [selectedAddressText, setSelectedAddressText] = useState<string>('');
  const [selectedAddressMeta, setSelectedAddressMeta] = useState<string>('');
  
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const path = usePathname();
  const [cartCount, setCartCount] = useState<number>(0);
  // global search
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('search') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const searchDebounceRef = useRef<number | null>(null);

  const applyAuthState = (user: AuthUser | null | undefined) => {
    setAuthed(Boolean(user));
    setAdmin(user?.role === 'ADMIN');

    if (!user?.selectedAddress) {
      setSelectedAddressText('Escolher endereco');
      setSelectedAddressMeta('Cadastre um endereco na sua conta');
      return;
    }

    const { label, street, number, city, state } = user.selectedAddress;
    setSelectedAddressText(label);
    setSelectedAddressMeta(`${street}, ${number} - ${city}/${state}`);
  };

  const navigateWithQuery = (v: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (v.trim()) params.set('search', v.trim());
    else params.delete('search');
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  // keep input in sync when user navigates back/forward or when searchParams change
  useEffect(() => {
    const s = searchParams?.get('search') ?? '';
    setQuery(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const user = await hydrateSession();
      if (!mounted) return;
      applyAuthState(user);
      setReady(true);
    })();

    const onAuthChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthUser | null>).detail;
      if (!mounted) return;
      applyAuthState(detail ?? getCurrentUser());
      setReady(true);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged as EventListener);

    // Inicializa com tema salvo ou do sistema
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }

    
    return () => {
      mounted = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged as EventListener);
    };
  }, []);

  // busca quantidade do carrinho quando o header monta
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const user = await hydrateSession();
        if (!user) {
          setCartCount(0);
          return;
        }
        const res = await api.get('/cart');
        if (!mounted) return;
        const data = res.data;
        const total = (data?.items ?? []).reduce((acc: number, it: { quantity: number }) => acc + it.quantity, 0);
        setCartCount(total ?? 0);
      } catch {
        if (mounted) setCartCount(0);
      }
    }
    void load();

    const onCartUpdated = () => void load();
    window.addEventListener('cart:updated', onCartUpdated as EventListener);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      mounted = false;
      window.removeEventListener('cart:updated', onCartUpdated as EventListener);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // cleanup debounce timers when unmounting
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const onLogout = () => {
    void (async () => {
      await logout();
      window.location.href = "/";
    })();
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  

  // Esconde HeaderBar nas telas de auth
  if (path === "/login" || path === "/register") return null;

  if (!ready) {
    return (
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'var(--color-header)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-10 w-full max-w-xl animate-pulse rounded-md bg-black/10 dark:bg-white/10" />
        </div>
      </header>
    );
  }

  // NavLink was removed; DesktopNav and MobileNav handle rendering navigation items

  // compute badge text
  const cartBadge = cartCount > 9 ? '+9' : String(cartCount);

  return (
    <>
    <header
      className="sticky top-0 z-40 border-b shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-[#0b0f1a]/70"
      style={{
        background: "var(--color-header)",
        borderColor: "var(--color-border)",
      }}
    >
  <div className="container mx-auto flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo - visible brand link */}
  <Link href="/" className="hidden md:inline-flex shrink-0 items-center font-bold text-lg text-brand" aria-label="Matriz 3D Studio - página inicial">Matriz 3D Studio</Link>

        <Link
          href="/account"
          className="hidden md:flex min-w-0 max-w-[230px] shrink-0 items-start gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-hover)] lg:max-w-[270px]"
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Entregar em</span>
            <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{selectedAddressText}</span>
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{selectedAddressMeta}</span>
          </span>
        </Link>

        {/* Search input placed in the header (desktop) */}
        <div className="hidden md:flex flex-1 px-2">
          <div className="relative w-full">
            <input
              id="header-search-input"
              data-header-search="true"
              className="w-full pl-9 pr-3 py-2 rounded-full border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand shadow-sm bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]"
              placeholder="Buscar produtos..."
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = window.setTimeout(() => {
                  navigateWithQuery(v);
                  searchDebounceRef.current = null;
                }, 450);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                  navigateWithQuery(query);
                }
              }}
              aria-label="Buscar produtos"
            />
              <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Desktop navigation (centralized) */}
        <div className="flex items-center gap-2">
          <DesktopNav
            authed={authed}
            admin={admin}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={onLogout}
            cartCount={cartCount}
            badgePulse={false}
          />

          {/* Chat and notifications moved into ActionIcons to keep action icons together */}
        </div>
        {/* Mobile right group: search input (left) + cart icon + hamburger on the right */}
        <div className="md:hidden flex items-center gap-3 w-full">
          {/* mobile search input occupies remaining space */}
          <div className="flex items-center flex-1">
            <div className="relative w-full">
              <input
                id="header-search-input-mobile"
                ref={mobileSearchRef}
                className="w-full pl-9 pr-3 py-2 rounded-full border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand shadow-sm bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)]"
                placeholder="Buscar produtos..."
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                  searchDebounceRef.current = window.setTimeout(() => {
                    navigateWithQuery(v);
                    searchDebounceRef.current = null;
                  }, 450);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                    navigateWithQuery(query);
                  }
                }}
                aria-label="Buscar produtos"
              />
              <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* cart icon */}
          <div className="flex items-center">
            {authed ? (
              <Link href="/cart" className="relative inline-flex items-center p-2 rounded-md hover:bg-[var(--color-hover)]">
                <CartIcon className="h-6 w-6 text-current" />
                <span className="sr-only">Carrinho</span>
                <span aria-live="polite" className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-brand text-white text-[11px] leading-none h-5 min-w-[1.25rem] px-1.5 font-medium">{cartBadge}</span>
              </Link>
            ) : (
              <button className="p-2 rounded-md hover:bg-[var(--color-hover)]" aria-label="Carrinho">
                <CartIcon className="h-5 w-5 text-current" />
              </button>
            )}
          </div>

          {/* hamburger menu */}
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((s) => !s)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-gray-700 transition hover:bg-black/5 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10 ${open ? 'invisible pointer-events-none' : ''}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {authed && (
        <Link
          href="/account"
          className="flex items-start gap-2 border-t border-[var(--color-border)] px-4 py-2 md:hidden"
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Entregar em</span>
            <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{selectedAddressText}</span>
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{selectedAddressMeta}</span>
          </span>
        </Link>
      )}
    </header>

    {/* Bottom navigation for mobile only */}
    <BottomNavBar />

    {/* Mobile menu managed by MobileNav component (rendered outside header to avoid stacking issues) */}
  <MobileNav open={open} setOpen={setOpen} authed={authed} admin={admin} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} />
    </>
  );
}
