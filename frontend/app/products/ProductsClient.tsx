"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
// Link removido (uso centralizado no HeaderBar)
import axios from 'axios';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';
import { addGuestItem } from '@/lib/cart';
import LoginModal from '@/app/_components/LoginModal';
import { toast } from 'sonner';
import ProductCard from '@/app/_components/ProductCard';
import useIntersectionObserver from '@/app/_components/useIntersectionObserver';

/* ===================== Tipos ===================== */
type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  wholesalePrice?: number | null;
  wholesaleEnabled?: boolean;
  wholesaleMinQuantity?: number | null;
  heightCm?: number | null;
  weightGrams?: number | null;
  printHours?: number | null;
  stock: number;
  imageUrl?: string | null; // 👈 adicionado
};

// resposta da API inclui total
type ProductsResponseFull = { items?: Product[]; total?: number };

type CategoryOption = { id: string; name: string; slug?: string };

type CategoryGroup = {
  parent: string;
  children: Array<{ id: string; label: string }>;
};

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome (A-Z)' },
];

function parseCategoryHierarchy(name: string) {
  const parts = name
    .split(/\s*(?:>|\/|::)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  return {
    parent: parts[0] ?? '',
    child: parts.slice(1).join(' / '),
  };
}

/* ===================== Página (client) ===================== */
export default function ProductsClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number>(0);

  const [sort, setSort] = useState<string>('relevance');
  const [category, setCategory] = useState<string>('');
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>([]);
  const [selectedCategoryParent, setSelectedCategoryParent] = useState<string | null>(null);
  const [cartQty, setCartQty] = useState<number>(0);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingGuestProduct, setPendingGuestProduct] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('ui:density');
      if (v === 'compact') setCompactMode(true);
    } catch {}
  
    const onDensity = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as string;
        setCompactMode(detail === 'compact');
      } catch {}
    };
    window.addEventListener('ui:density:changed', onDensity as EventListener);
    return () => window.removeEventListener('ui:density:changed', onDensity as EventListener);
  }, []);

  const searchParams = useSearchParams();
  const searchParamsKey = searchParams?.toString() ?? '';

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, Array<{ id: string; label: string }>>();

    for (const categoryOption of categoriesList) {
      const hierarchy = parseCategoryHierarchy(categoryOption.name);
      if (!hierarchy) continue;

      const current = map.get(hierarchy.parent) ?? [];
      current.push({ id: categoryOption.id, label: hierarchy.child });
      map.set(hierarchy.parent, current);
    }

    return Array.from(map.entries())
      .map(([parent, children]) => ({
        parent,
        children: children.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
      }))
      .sort((a, b) => a.parent.localeCompare(b.parent, 'pt-BR', { sensitivity: 'base' }));
  }, [categoriesList]);

  const flatCategoryOptions = useMemo(
    () =>
      categoriesList
        .map((item) => ({ id: item.id, label: item.name.trim() }))
        .filter((item) => item.label.length > 0)
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
    [categoriesList],
  );

  const selectedCategoryGroup = useMemo(
    () => categoryGroups.find((group) => group.parent === selectedCategoryParent) ?? null,
    [categoryGroups, selectedCategoryParent],
  );

  const fetchProducts = useCallback(
    async (opts?: {
      term?: string;
      page?: number;
      perPage?: number;
      append?: boolean;
      sort?: string;
      category?: string;
    }) => {
      const {
        term = search,
        page = 1,
        perPage = PER_PAGE,
        append = false,
        sort: sortOpt = sort,
        category: categoryOpt = category,
      } = opts ?? {};

      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        setLoading(true);
        setError(null);

        const params: Record<string, unknown> = { page, perPage };
        if (term) params.search = term;
        if (sortOpt) params.sort = sortOpt;
        if (categoryOpt) params.category = categoryOpt;

        const res = await api.get<ProductsResponseFull>('/products', {
          params,
          signal: ctrl.signal as AbortSignal,
        });

        const list = res.data.items ?? [];
        const totalRes = Number(res.data?.total ?? 0);
        setHasMore(list.length === PER_PAGE);
        setTotal(totalRes);

        if (append) {
          setItems((prev) => [...prev, ...list]);
        } else {
          setItems(list);
        }

      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          if (e.code === 'ERR_CANCELED') return;
          if (e.response?.status === 401) {
            toast.error('Sessão expirada. Faça login para gerenciar o carrinho.');
            setError('Sessão expirada');
            return;
          }
          const msg =
            (e.response?.data as { message?: string } | undefined)?.message ??
            e.message ??
            'Erro ao carregar produtos';
          setError(msg);
          toast.error(msg);
        } else if (e instanceof Error) {
          setError(e.message);
          toast.error(e.message);
        } else {
          setError('Erro ao carregar produtos');
          toast.error('Erro ao carregar produtos');
        }
      } finally {
        setLoading(false);
      }
    },
    [search, sort, category],
  );

  const router = useRouter();
  const pathname = usePathname();

  const updateProductsQuery = useCallback(
    (patch: { search?: string | null; sort?: string | null; category?: string | null }) => {
      const params = new URLSearchParams(searchParamsKey);

      if (patch.search !== undefined) {
        const nextSearch = patch.search?.trim() ?? '';
        if (nextSearch) params.set('search', nextSearch);
        else params.delete('search');
      }

      if (patch.sort !== undefined) {
        const nextSort = patch.sort ?? '';
        if (!nextSort || nextSort === 'relevance') params.delete('sort');
        else params.set('sort', nextSort);
      }

      if (patch.category !== undefined) {
        const nextCategory = patch.category ?? '';
        if (nextCategory) params.set('category', nextCategory);
        else params.delete('category');
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParamsKey],
  );

  useEffect(() => {
    const q = searchParams?.get('search') ?? '';
    const s = searchParams?.get('sort') ?? 'relevance';
    const c = searchParams?.get('category') ?? '';

    setSearch(q);
    setSort(s);
    setCategory(c);

    void fetchProducts({ term: q.trim(), page: 1, sort: s, category: c });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey]);

  useEffect(() => {
    if (!category) return;

    const group = categoryGroups.find((item) => item.children.some((child) => child.id === category));
    if (group) setSelectedCategoryParent(group.parent);
  }, [category, categoryGroups]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await api.get('/categories');
        if (!mounted) return;
        setCategoriesList(res.data ?? []);
      } catch {}
    })();

    const onCategoriesChanged = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as string | undefined;
        if (detail) {
          const normalizedDetail = detail.trim().toLowerCase();
          const matchedCategory = categoriesList.find((c) =>
            c.id === detail ||
            c.name.trim().toLowerCase() === normalizedDetail ||
            c.slug === normalizedDetail ||
            parseCategoryHierarchy(c.name)?.child.trim().toLowerCase() === normalizedDetail,
          );

          updateProductsQuery({ category: matchedCategory?.id ?? detail });
        } else {
          void (async () => {
            try {
              const res = await api.get('/categories');
              if (!mounted) return;
              setCategoriesList(res.data ?? []);
            } catch {}
          })();
        }
      } catch {}
    };

    window.addEventListener('categories:changed', onCategoriesChanged as EventListener);
    return () => { mounted = false; window.removeEventListener('categories:changed', onCategoriesChanged as EventListener); };
  }, [categoriesList, updateProductsQuery]);

  

  const fetchCartQty = useCallback(async () => {
    try {
      const user = await hydrateSession();
      if (!user) {
        setCartQty(0);
        return;
      }
      const res = await api.get('/cart');
      const total = (res.data?.items ?? []).reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0,
      );
      setCartQty(total);
    } catch {
      setCartQty(0);
    }
  }, []);

  useEffect(() => {
    void fetchCartQty();
  }, [fetchCartQty]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchProducts({ term: search.trim(), page: next, append: true });
  }, [hasMore, loading, page, fetchProducts, search]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const e = entries[0];
      if (!e) return;
      if (e.isIntersecting && hasMore && !loading) {
        void loadMore();
      }
    },
    [hasMore, loading, loadMore],
  );

  useIntersectionObserver({ target: sentinelRef, onIntersect: handleIntersect, enabled: hasMore && !loading });

  async function addToCart(productId: string) {
    const user = await hydrateSession();
    if (!user) {
      setPendingGuestProduct(productId);
      setShowLoginModal(true);
      return;
    }

    const prev = cartQty;
    setCartQty((q) => q + 1);

    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      try {
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch {}
      toast.success('Item adicionado ao carrinho!');
    } catch (e: unknown) {
      setCartQty(prev);
      let msg = 'Erro ao adicionar ao carrinho';
      if (axios.isAxiosError(e)) {
        msg =
          (e.response?.data as { message?: string } | undefined)?.message ??
          e.message ??
          msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
    }
  }

  function handleContinueGuest() {
    if (!pendingGuestProduct) return;
    addGuestItem(pendingGuestProduct, 1);
    setCartQty((q) => q + 1);
    try {
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch {}
    setShowLoginModal(false);
    setPendingGuestProduct(null);
  }

  function handleLoginNow() {
    window.location.href = '/login';
  }

  const hasResults = useMemo(() => items.length > 0, [items]);

  function clearFilters() {
    setSearch('');
    setSort('relevance');
    setCategory('');
    setSelectedCategoryParent(null);
    setPage(1);
    updateProductsQuery({ search: '', sort: 'relevance', category: '' });
  }

  return (
    <main className="mx-auto max-w-screen-xl px-3 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginNow}
        onContinueGuest={handleContinueGuest}
      />

      <section className="sticky top-[57px] md:top-[65px] z-30">
        <div className="card p-3 md:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((option) => {
              const active = sort === option.value || (!sort && option.value === 'relevance');
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSort(option.value);
                    updateProductsQuery({ sort: option.value });
                  }}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                  )}
                >
                  {option.label}
                </button>
              );
            })}

            <button onClick={clearFilters} className="btn btn-outline ml-auto text-xs px-3 py-1.5 h-auto">
              Limpar filtros
            </button>
          </div>

          {categoryGroups.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {categoryGroups.map((group) => {
                  const active = selectedCategoryParent === group.parent;
                  return (
                    <button
                      key={group.parent}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryParent(group.parent);
                        setCategory('');
                        setPage(1);
                        updateProductsQuery({ category: '' });
                      }}
                      className={clsx(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                      )}
                    >
                      {group.parent}
                    </button>
                  );
                })}
              </div>

              {selectedCategoryGroup && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('');
                      setPage(1);
                      updateProductsQuery({ category: '' });
                    }}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      !category
                        ? 'border-brand bg-brand text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                    )}
                  >
                    Todas de {selectedCategoryGroup.parent}
                  </button>

                  {selectedCategoryGroup.children.map((sub) => {
                    const active = category === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setCategory(sub.id);
                          setPage(1);
                          updateProductsQuery({ category: sub.id });
                        }}
                        className={clsx(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          active
                            ? 'border-brand bg-brand text-white'
                            : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                        )}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : flatCategoryOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('');
                  setSelectedCategoryParent(null);
                  setPage(1);
                  updateProductsQuery({ category: '' });
                }}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  !category
                    ? 'border-brand bg-brand text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                )}
              >
                Todas
              </button>

              {flatCategoryOptions.map((option) => {
                const active = category === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setCategory(option.id);
                      setSelectedCategoryParent(null);
                      setPage(1);
                      updateProductsQuery({ category: option.id });
                    }}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-brand bg-brand text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-brand">Produtos</h1>
        <div className="text-sm text-slate-600">Exibindo <span className="font-medium">{items.length}</span> de <span className="font-medium">{total}</span> produtos</div>
      </header>

      {error && (
        <p className="text-red-600 text-sm" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {loading && (
        <ul className={"grid gap-3 auto-rows-fr " + (compactMode ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="card p-1 sm:p-2 md:p-3 flex flex-col gap-2 h-full animate-pulse">
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[3/2] 2xl:aspect-[4/3] overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 min-h-10 md:min-h-12 space-y-2">
                <div className="h-4 w-3/5 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex items-center justify-center flex-col gap-2 w-full">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && !hasResults && (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Nenhum produto encontrado para os filtros aplicados. Tente limpar os filtros ou alterar a busca.
          </p>
          <div className="flex justify-center">
            <button onClick={clearFilters} className="btn border border-black/10 dark:border-white/10">
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {!loading && hasResults && (
        <>
          <ul className={"grid gap-3 auto-rows-fr " + (compactMode ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} searchTerm={search} onAddToCart={addToCart} />
            ))}
          </ul>

          {hasMore && (
            <div className="flex flex-col items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                className="btn btn-outline"
              >
                Carregar mais produtos
              </button>
              <div ref={sentinelRef} style={{ width: '1px', height: '1px' }} aria-hidden />
            </div>
          )}
        </>
      )}
    </main>
  );
}
