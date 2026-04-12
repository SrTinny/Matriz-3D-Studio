"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from 'react';
import clsx from "clsx";
// CartIcon moved to ActionIcons; not used directly here
import ActionIcons from './ActionIcons';
import navigation from '@/lib/navigation';

type Props = {
  authed: boolean;
  admin: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout: () => void;
  cartCount: number;
  badgePulse: boolean;
};

export default function DesktopNav({ authed, admin, theme, toggleTheme, onLogout, cartCount, badgePulse }: Props) {
  const path = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    setOpenMenu(null);
  }, [path]);

  const NavLink = ({ href, label, className }: { href: string; label: React.ReactNode; className?: string }) => {
    const active = path.startsWith(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-brand/10 text-brand" : "text-gray-700 hover:text-brand dark:text-gray-300 dark:hover:text-brand",
          className,
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="hidden md:flex items-center gap-2 sm:gap-3">
      {navigation.map((item) => (
        item.children ? (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => setOpenMenu(item.label)}
            onMouseLeave={() => setOpenMenu((prev) => (prev === item.label ? null : prev))}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setOpenMenu((prev) => (prev === item.label ? null : prev));
              }
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === item.label}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
              onFocus={() => setOpenMenu(item.label)}
              onClick={() => setOpenMenu((prev) => (prev === item.label ? null : item.label))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenMenu((prev) => (prev === item.label ? null : item.label));
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setOpenMenu(item.label);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpenMenu(null);
                  (e.currentTarget as HTMLButtonElement).blur();
                }
              }}
            >
              {item.label}
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
            </button>
            <div
              role="menu"
              className={clsx(
                'absolute left-0 mt-2 w-48 rounded-md border shadow-lg transition-opacity',
                openMenu === item.label ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none',
              )}
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <ul className="py-2">
                {item.children.map((sub) => (
                  <li key={sub.label}>
                    <Link
                      role="menuitem"
                      href={sub.href}
                      className="block px-4 py-2 text-sm"
                      style={{ color: 'var(--color-text)' }}
                      onClick={() => setOpenMenu(null)}
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <NavLink key={item.label} href={item.href ?? '#'} label={item.label} />
        )
      ))}

      {/* Cart link removed here to avoid duplication with ActionIcons (cart shown in ActionIcons) */}

      <ActionIcons
        authed={authed}
        admin={admin}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
        cartCount={cartCount}
        badgePulse={badgePulse}
      />
    </nav>
  );
}
