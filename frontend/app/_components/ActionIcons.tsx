"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from 'react';
import { CartIcon } from "@/app/_components/Icons";
import clsx from "clsx";

type Props = {
  authed: boolean;
  admin: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout: () => void;
  cartCount: number;
  badgePulse?: boolean;
};

export default function ActionIcons({ authed, admin, theme, toggleTheme, onLogout, cartCount, badgePulse }: Props) {
  const badge = cartCount > 9 ? '+9' : String(cartCount);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const scheduleCloseMenu = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setMenuOpen(false);
      closeTimerRef.current = null;
    }, 180);
  };

  useEffect(() => {
    const compute = () => {
      try {
        const raw = localStorage.getItem('matriz3dstudio:notifications:state');
        if (!raw) { setNotifCount(0); return; }
        const arr = JSON.parse(raw) as Array<{ unread?: boolean }>;
        const c = arr.filter((i) => i.unread).length;
        setNotifCount(c);
      } catch { setNotifCount(0); }
    };
    compute();
    window.addEventListener('notifications:changed', compute as EventListener);
    return () => {
      clearCloseTimer();
      window.removeEventListener('notifications:changed', compute as EventListener);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Link href="/cart" aria-label="Carrinho" className="relative inline-flex items-center p-2 rounded-md hover:bg-[var(--color-hover)]" style={{ borderColor: 'var(--color-border)' }}>
        <CartIcon className="h-6 w-6" />
        <span className="sr-only">Carrinho</span>
        {cartCount > 0 && (
          <span aria-live="polite" className={clsx("absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-brand text-white text-[10px] leading-none h-5 min-w-[1.25rem] px-1.5 font-medium", badgePulse ? 'scale-110 shadow-md' : '')}>{badge}</span>
        )}
      </Link>

      <div
        className="relative"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleCloseMenu}
        onFocus={openMenu}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            scheduleCloseMenu();
          }
        }}
      >
        <button
          type="button"
          aria-label="Abrir menu de perfil"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => {
            clearCloseTimer();
            setMenuOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              clearCloseTimer();
              setMenuOpen(false);
              (e.currentTarget as HTMLButtonElement).blur();
            }
          }}
          className="relative z-[1] p-2 rounded-md border hover:bg-[var(--color-hover)]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-3-3.87" />
            <path d="M4 21v-2a4 4 0 013-3.87" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-brand text-white text-[10px] leading-none h-5 min-w-[1.25rem] px-1.5 font-medium">
              {notifCount > 9 ? '+9' : notifCount}
            </span>
          )}
        </button>

        <div
          className={clsx(
            'absolute right-0 top-full z-50 w-64 pt-2 transition-opacity',
            menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
          )}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
        >
          <div
            role="menu"
            className="rounded-xl border p-2 shadow-xl"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex flex-col gap-1">
            {authed ? (
              <Link
                href="/account"
                role="menuitem"
                className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
                onClick={() => setMenuOpen(false)}
              >
                Minha conta
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  role="menuitem"
                  className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
                  onClick={() => setMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  role="menuitem"
                  className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
                  onClick={() => setMenuOpen(false)}
                >
                  Criar conta
                </Link>
              </>
            )}

            <Link
              href="/notifications"
              role="menuitem"
              className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
              onClick={() => setMenuOpen(false)}
            >
              Notificações
            </Link>
            <Link
              href="/chat"
              role="menuitem"
              className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
              onClick={() => setMenuOpen(false)}
            >
              Chat
            </Link>

            {authed && admin && (
              <Link
                href="/admin/products"
                role="menuitem"
                className="rounded-md px-3 py-2 text-sm hover:bg-[var(--color-hover)]"
                onClick={() => setMenuOpen(false)}
              >
                Painel admin
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
              className="rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
            >
              {theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            </button>

            {authed && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--color-hover)]"
              >
                Sair
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
