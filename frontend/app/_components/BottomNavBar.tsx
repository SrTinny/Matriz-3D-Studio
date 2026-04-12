"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';

export default function BottomNavBar() {
  const path = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const user = await hydrateSession();
        if (!user) { if (mounted) setCartCount(0); return; }
        const res = await api.get('/cart');
        if (!mounted) return;
        const total = (res.data?.items ?? []).reduce((acc: number, it: { quantity: number }) => acc + it.quantity, 0);
        setCartCount(total);
      } catch { if (mounted) setCartCount(0); }
    }
    void load();
    const onUpdate = () => void load();
    window.addEventListener('cart:updated', onUpdate);
    return () => { mounted = false; window.removeEventListener('cart:updated', onUpdate); };
  }, []);

  const NavItem = ({ href, label, icon, badge }: { href: string; label: string; icon: React.ReactNode; badge?: number }) => {
    const active = path === href || (href !== '/' && path.startsWith(href));
    return (
      <Link href={href} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? 'text-brand' : 'text-gray-500 dark:text-gray-400'}`}>
        <div className="relative">
          {icon}
          {badge != null && badge > 0 ? (
            <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-brand text-white text-[10px] h-4 min-w-[1rem] px-1 font-medium leading-none">{badge > 9 ? '+9' : badge}</span>
          ) : null}
        </div>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-pb" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        <NavItem href="/" label="Início" icon={
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5L12 4l9 7.5"/><path d="M9 21V12h6v9"/>
          </svg>
        } />
        <NavItem href="/cart" label="Carrinho" badge={cartCount} icon={
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
          </svg>
        } />
        <NavItem href="/account" label="Conta" icon={
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        } />
      </div>
    </nav>
  );
}
