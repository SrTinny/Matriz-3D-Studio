"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';
import { addGuestItem } from '@/lib/cart';
import ProductCard from '@/app/_components/ProductCard';
import LoginModal from '@/app/_components/LoginModal';
import HomePageSkeleton from '@/app/_components/HomePageSkeleton';

type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  tag?: 'Promoção' | 'Novo';
  category?: { id: string; name: string } | null;
};

type ProductsResponseFull = { items?: Product[]; total?: number };

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

type HeroSlide = {
  badge: string;
  title: string;
  subtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  tone: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: 'truck' | 'shield' | 'ticket' | 'bolt' | 'gift' | 'credit';
};

const HERO_SLIDES: HeroSlide[] = [
  {
    badge: 'Coleções 3D',
    title: 'Peças 3D prontas para destacar qualquer vitrine',
    subtitle: 'Uma experiência pensada para assets, decoração e objetos de cena, com navegação rápida e foco em descoberta visual.',
    ctaPrimary: { label: 'Ver catálogo 3D', href: '/products' },
    ctaSecondary: { label: 'Explorar lançamentos', href: '/products?sort=name_asc' },
    tone: 'from-secondary-orange via-brand to-secondary-red',
  },
  {
    badge: 'Arquivos organizados',
    title: 'Modelos por uso, escala e acabamento',
    subtitle: 'Encontre peças decorativas, itens funcionais e coleções premium com filtros claros e compra direta.',
    ctaPrimary: { label: 'Explorar objetos', href: '/products' },
    ctaSecondary: { label: 'Ver mais pedidos', href: '/products?sort=relevance' },
    tone: 'from-secondary-green via-brand to-secondary-orange',
  },
  {
    badge: 'Matriz 3D Studio',
    title: 'Vitrines por ambiente, projeto e referência estética',
    subtitle: 'Uma estrutura leve para destacar lançamentos, peças sob encomenda e coleções que combinam com seu projeto.',
    ctaPrimary: { label: 'Explorar coleções', href: '/products?sort=name_asc' },
    ctaSecondary: { label: 'Abrir vitrine completa', href: '/products' },
    tone: 'from-brand via-secondary-orange to-secondary-red',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Entrega digital',
    description: 'Acesso rápido aos seus arquivos e coleções.',
    href: '/products',
    icon: 'truck',
  },
  {
    title: 'Pagamento seguro',
    description: 'Fluxo protegido e transparente.',
    href: '/privacy',
    icon: 'shield',
  },
  {
    title: 'Lançamentos',
    description: 'Novidades e peças destacadas do catálogo.',
    href: '/products?sort=price_asc',
    icon: 'ticket',
  },
  {
    title: 'Coleções sob medida',
    description: 'Peças para briefing e projetos específicos.',
    href: '/contact',
    icon: 'bolt',
  },
  {
    title: 'Assets para cena',
    description: 'Descobertas organizadas por estilo e uso.',
    href: '/products',
    icon: 'gift',
  },
  {
    title: 'Licença clara',
    description: 'Regras de uso explicadas sem ruído.',
    href: '/privacy',
    icon: 'credit',
  },
];

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function renderQuickActionIcon(icon: QuickAction['icon']) {
  switch (icon) {
    case 'truck':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 3v5h-7" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z" />
          <path d="M9.5 12.5l2 2 4-4" />
        </svg>
      );
    case 'ticket':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 010 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 010-4V8z" />
          <path d="M12 7v10" />
        </svg>
      );
    case 'bolt':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case 'gift':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13" />
          <path d="M3 12h18" />
          <path d="M7.5 8a2.5 2.5 0 112.5-2.5V8h-2.5z" />
          <path d="M16.5 8A2.5 2.5 0 0014 5.5V8h2.5z" />
        </svg>
      );
    case 'credit':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" />
        </svg>
      );
    default:
      return null;
  }
}

type ScrollableRowProps = { children: React.ReactNode; className?: string };

function ScrollableRow({ children, className }: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanLeft(el.scrollLeft > 2);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.75 : -el.clientWidth * 0.75, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        ref={scrollRef}
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-md transition-opacity ${canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-label="Rolar para a esquerda"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      <button
        type="button"
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-md transition-opacity ${canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-label="Rolar para a direita"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}

type ShelfSectionProps = {
  title: string;
  subtitle?: string;
  ctaHref: string;
  ctaLabel: string;
  products: Product[];
  onAddToCart: (productId: string) => Promise<void> | void;
};

function ShelfSection({ title, subtitle, ctaHref, ctaLabel, products, onAddToCart }: ShelfSectionProps) {
  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
        </div>
        <Link href={ctaHref} className="shrink-0 text-sm font-medium text-brand hover:underline">
          {ctaLabel}
        </Link>
      </div>

      <ScrollableRow>
        <ul className="grid grid-flow-col auto-cols-[minmax(155px,1fr)] sm:auto-cols-[minmax(190px,1fr)] md:auto-cols-[minmax(220px,1fr)] gap-3 pb-1">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} searchTerm="" onAddToCart={onAddToCart} />
          ))}
        </ul>
      </ScrollableRow>
    </section>
  );
}

export default function HomeClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingGuestProduct, setPendingGuestProduct] = useState<string | null>(null);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, categoriesRes] = await Promise.all([
        api.get<ProductsResponseFull>('/products', {
          params: { page: 1, perPage: 36, sort: 'relevance' },
        }),
        api.get<CategoryOption[]>('/categories'),
      ]);

      setProducts(productsRes.data?.items ?? []);
      setCategories(categoriesRes.data ?? []);
    } catch (err: unknown) {
      let message = 'Nao foi possivel carregar a home no momento.';
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message ??
          message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const heroSlide = HERO_SLIDES[activeSlide] ?? HERO_SLIDES[0];

  const heroProduct = useMemo(() => {
    if (!products.length) return null;
    return products[activeSlide % products.length] ?? null;
  }, [products, activeSlide]);

  const categoryShortcuts = useMemo(() => {
    if (categories.length) {
      return categories.slice(0, 12).map((category) => ({
        value: category.id,
        label: category.name,
      }));
    }

    const map = new Map<string, string>();
    for (const product of products) {
      if (!product.category?.id || !product.category?.name) continue;
      if (!map.has(product.category.id)) {
        map.set(product.category.id, product.category.name);
      }
    }

    return Array.from(map.entries()).slice(0, 12).map(([value, label]) => ({ value, label }));
  }, [categories, products]);

  const featuredProducts = useMemo(
    () => products.filter((product) => Boolean(product.tag)).slice(0, 10),
    [products],
  );

  const bestDeals = useMemo(
    () => [...products].sort((a, b) => a.price - b.price).slice(0, 10),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 0).slice(0, 10),
    [products],
  );

  const addToCart = useCallback(async (productId: string) => {
    const user = await hydrateSession();
    if (!user) {
      setPendingGuestProduct(productId);
      setShowLoginModal(true);
      return;
    }

    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      try {
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch {
        // no-op
      }
      toast.success('Item adicionado ao carrinho!');
    } catch (err: unknown) {
      let message = 'Erro ao adicionar ao carrinho';
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message ??
          message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  }, []);

  function handleContinueGuest() {
    if (!pendingGuestProduct) return;
    addGuestItem(pendingGuestProduct, 1);
    setPendingGuestProduct(null);
    setShowLoginModal(false);
    toast.success('Item guardado no carrinho de convidado.');
  }

  function handleLoginNow() {
    window.location.href = '/login';
  }

  if (loading) {
    return <HomePageSkeleton />;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-screen-xl p-6">
        <section className="card p-6 text-center">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Nao foi possivel carregar a pagina inicial</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button type="button" onClick={() => void loadHomeData()} className="btn btn-primary mt-4">
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-xl p-4 md:p-6 space-y-6">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginNow}
        onContinueGuest={handleContinueGuest}
      />

      <section className="relative overflow-hidden rounded-3xl border shadow-xl" style={{ borderColor: 'var(--color-border)' }}>
        <div className={`absolute inset-0 bg-gradient-to-r ${heroSlide.tone}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-center p-5 md:p-8 text-white">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {heroSlide.badge}
            </span>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-xl">{heroSlide.title}</h1>
            <p className="text-sm md:text-base text-white/90 max-w-xl">{heroSlide.subtitle}</p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Link href={heroSlide.ctaPrimary.href} className="btn bg-white text-slate-900 hover:bg-white/90">
                {heroSlide.ctaPrimary.label}
              </Link>
              <Link href={heroSlide.ctaSecondary.href} className="btn border border-white/40 bg-transparent text-white hover:bg-white/10">
                {heroSlide.ctaSecondary.label}
              </Link>
            </div>
          </div>

          <div className="hidden lg:block card p-3 bg-white/95 text-slate-900 border-white/60">
            {heroProduct ? (
              <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-black/5">
                  <Image
                    src={heroProduct.imageUrl ?? '/placeholder.svg'}
                    alt={heroProduct.name}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Destaque da vitrine</p>
                  <h2 className="text-sm font-semibold leading-snug">{heroProduct.name}</h2>
                  <p className="text-base font-bold text-brand">{formatBRL(heroProduct.price)}</p>
                  <Link href={`/products/${heroProduct.slug}`} className="text-xs font-semibold text-brand hover:underline">
                    Ver produto
                  </Link>
                </div>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-sm text-slate-500">Sem destaque disponivel.</div>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-1 pb-3">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.badge}
              type="button"
              aria-label={`Ir para banner ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                activeSlide === index ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Explore por categoria</h2>
          <Link href="/products" className="shrink-0 text-sm font-medium text-brand hover:underline">
            Ver tudo
          </Link>
        </div>

        <ScrollableRow>
          <div className="flex gap-2 pb-1">
            <Link
              href="/products"
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-[var(--color-hover)]"
            >
              Todas
            </Link>
            {categoryShortcuts.map((category) => (
              <Link
                key={category.value}
                href={`/products?category=${encodeURIComponent(category.value)}`}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-[var(--color-hover)]"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </ScrollableRow>
      </section>

      <section>
        <ScrollableRow className="sm:hidden">
          <div className="flex gap-2 pb-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium whitespace-nowrap hover:bg-[var(--color-hover)]"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand">
                  {renderQuickActionIcon(action.icon)}
                </span>
                <span>{action.title}</span>
              </Link>
            ))}
          </div>
        </ScrollableRow>

        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.title} href={action.href} className="card p-3 space-y-2 hover:shadow-xl transition-shadow">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                {renderQuickActionIcon(action.icon)}
              </span>
              <h3 className="text-sm font-semibold leading-tight">{action.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <ShelfSection
        title="Peças em Destaque"
        ctaHref="/products?sort=price_asc"
        ctaLabel="Ver mais ofertas"
        products={featuredProducts}
        onAddToCart={addToCart}
      />

      <ShelfSection
        title="Disponíveis para produção imediata"
        ctaHref="/products"
        ctaLabel="Explorar catalogo"
        products={outOfStockProducts}
        onAddToCart={addToCart}
      />
    </main>
  );
}
