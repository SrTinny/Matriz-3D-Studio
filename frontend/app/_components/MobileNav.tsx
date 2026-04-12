"use client";

import Link from "next/link";
import clsx from "clsx";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authed: boolean;
  admin: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout: () => void;
  // cartCount and badgePulse intentionally omitted because ActionIcons is shown in header on mobile
};

import navigation from '@/lib/navigation';

export default function MobileNav({ open, setOpen, authed, admin, theme, toggleTheme, onLogout }: Props) {
  return (
    <>
      {/* Drawer overlay - visible when open */}
      <div
        aria-hidden={!open}
        className={clsx(
          "fixed inset-0 bg-black/40 transition-opacity duration-300 z-40",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={clsx(
          "fixed top-0 left-0 h-full w-72 max-w-full shadow-xl transform transition-transform duration-300 z-50",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: 'var(--color-card)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/10" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-lg font-semibold text-brand">Menu</div>
          <button aria-label="Fechar menu" onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-[var(--color-hover)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="px-4 py-4 overflow-y-auto h-[calc(100%-56px)]">
          {navigation.map((item) => (
            item.children ? (
              <div key={item.label} className="mb-3">
                <div className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-300">{item.label}</div>
                <div className="pl-3">
                  {item.children.map((sub) => (
                    <Link key={sub.label} href={sub.href} className="block w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:text-brand">{sub.label}</Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={item.label} href={item.href ?? '#'} className="block w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand mb-1">{item.label}</Link>
            )
          ))}

          {/* Admin link (visible only to authenticated admins) */}
          {authed && admin && (
            <div className="mt-3">
              <Link href="/admin/products" className="block w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand mb-1">Admin</Link>
            </div>
          )}

          <div className="mt-2">
            <button onClick={toggleTheme} className="w-full rounded-md border border-black/10 px-3 py-2 text-left text-sm dark:border-white/10">
              {theme === 'light' ? '🌙 Tema escuro' : '☀️ Tema claro'}
            </button>
          </div>

          <div className="mt-2">
            <button
              onClick={() => {
                try {
                  const current = localStorage.getItem('ui:density');
                  const next = current === 'compact' ? 'comfortable' : 'compact';
                  localStorage.setItem('ui:density', next);
                  window.dispatchEvent(new CustomEvent('ui:density:changed', { detail: next }));
                } catch {}
              }}
              className="w-full rounded-md border border-black/10 px-3 py-2 text-left text-sm dark:border-white/10"
            >
              Alternar densidade
            </button>
          </div>

          <div className="mt-3">
            {!authed ? (
              <>
                <Link href="/login" className="block w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:text-brand">Login</Link>
                <Link href="/register" className="block w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:text-brand">Cadastro</Link>
              </>
            ) : null}
          </div>
          {/* Footer links moved here for mobile */}
          <div className="mt-6 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
            <Link href="/privacy" className="block w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:text-brand">Privacidade</Link>
            <Link href="/contact" className="block w-full rounded-md px-3 py-2 text-sm text-gray-700 hover:text-brand">Contato</Link>
          </div>

          {/* Logout placed last in the menu when authenticated */}
          {authed && (
            <div className="mt-4">
              <button onClick={onLogout} className="w-full rounded-md bg-brand px-3 py-2 text-left text-sm font-medium text-white">Sair</button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
