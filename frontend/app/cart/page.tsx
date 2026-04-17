'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';
import { toast } from 'sonner';
import { PlusIcon, MinusIcon, TrashIcon } from '@/app/_components/Icons';

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
};

type ProductDetailsResponse = {
  imageUrl?: string | null;
};

type Cart = {
  id: string;
  items: CartItem[];
};

export default function CartPage() {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const user = await hydrateSession();
      if (!mounted) return;

      if (!user) {
        window.location.href = '/login';
        return;
      }

      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/cart');
      const rawCart = res.data as Cart;

      const enrichedItems = await Promise.all(
        rawCart.items.map(async (item) => {
          if (item.product.imageUrl?.trim()) return item;

          try {
            const productRes = await api.get<ProductDetailsResponse>(`/products/${item.product.id}`);
            return {
              ...item,
              product: {
                ...item.product,
                imageUrl: productRes.data?.imageUrl ?? null,
              },
            };
          } catch {
            return item;
          }
        }),
      );

      setCart({ ...rawCart, items: enrichedItems });
      if (rawCart.items.length === 0) {
        toast.info('Seu carrinho está vazio.');
      }
    } catch (e: unknown) {
      let msg = 'Erro ao carregar carrinho';
      if (axios.isAxiosError(e)) {
        msg =
          (e.response?.data as { message?: string } | undefined)?.message ??
          e.message ??
          msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) void load();
  }, [ready]);

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  }, [cart]);

  const totalQty = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  const outOfStockCount = useMemo(() => {
    if (!cart) return 0;
    return cart.items.filter((it) => it.product.stock <= 0).length;
  }, [cart]);

  const resolveImageSrc = (src?: string | null) => src?.trim() || '/placeholder.svg';

  // logout é gerenciado pelo HeaderBar global

  async function updateQty(item: CartItem, nextQty: number) {
    if (nextQty < 1) return;
    if (item.product.stock > 0 && nextQty > item.product.stock) {
      toast.warning('Quantidade acima do estoque disponível.');
      return;
    }
    try {
      setSavingId(item.id);
      await api.patch(`/cart/items/${item.id}`, { quantity: nextQty });
      await load();
      toast.success('Quantidade atualizada');
    } catch (e: unknown) {
      let msg = 'Erro ao atualizar item';
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
      setSavingId(null);
    }
  }

  async function removeItem(itemId: string) {
    try {
      setRemovingId(itemId);
      await api.delete(`/cart/items/${itemId}`);
      await load();
      toast.success('Item removido');
    } catch (e: unknown) {
      let msg = 'Erro ao remover item';
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
      setRemovingId(null);
    }
  }

  async function clearCart() {
    try {
      if (!confirm('Deseja limpar o carrinho?')) return;
      await api.delete('/cart');
      await load();
      toast.success('Carrinho limpo');
    } catch (e: unknown) {
      let msg = 'Erro ao limpar carrinho';
      if (axios.isAxiosError(e)) {
        msg =
          (e.response?.data as { message?: string } | undefined)?.message ??
          e.message ??
          msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    }
  }

  function handleFinalize() {
    if (outOfStockCount > 0) {
      toast.warning('Seu carrinho tem itens sob produção.', {
        description:
          'As peças sem estoque ainda serão produzidas antes do envio. A entrega pode demorar mais que o normal.',
      });
      return;
    }

    toast.info('Fluxo de checkout (futuro)');
  }

  if (!ready) return null;

  return (
    <main className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-6 space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-xl sm:text-2xl font-semibold text-brand">Meu carrinho</h1>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-2 text-sm">
            Itens:
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-brand text-white">
              {totalQty}
            </span>
          </span>
        </div>
      </header>

      {error && (
        <p className="text-red-600 text-sm" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {/* SKELETON */}
      {loading && (
        <ul className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="card p-3 sm:p-4 grid gap-3 grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[auto_1fr_auto] items-start animate-pulse"
            >
              <div className="h-24 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="min-w-0">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-start">
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && cart && cart.items.length === 0 && (
        <div className="rounded-lg border p-4 text-sm text-slate-700 dark:text-slate-300" style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
          Seu carrinho está vazio.{' '}
          <Link href="/products" className="text-accent underline hover:text-brand">
            Explore produtos
          </Link>
          .
        </div>
      )}

      {!loading && cart && cart.items.length > 0 && (
        <>
          <ul className="grid gap-3">
            {cart.items.map((it) => {
              const disabledRow = savingId === it.id || removingId === it.id;
              const isMadeToOrder = it.product.stock <= 0;
              return (
                <li
                  key={it.id}
                  className="card p-3 sm:p-4 grid gap-3 grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[auto_1fr_auto] items-start"
                >
                  <div className="relative h-24 w-24 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/5 dark:ring-white/5">
                    <div
                      role="img"
                      aria-label={it.product.name}
                      className="h-full w-full bg-center bg-cover"
                      style={{ backgroundImage: `url(${resolveImageSrc(it.product.imageUrl)})` }}
                    />
                  </div>

                  {/* Info do produto */}
                  <div className="min-w-0 space-y-2">
                    <div className="font-medium text-base sm:text-lg leading-snug line-clamp-2">{it.product.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium">R$ {it.product.price.toFixed(2)}</span>
                      <span className="hidden sm:inline">·</span>
                      {isMadeToOrder ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                          Produção sob demanda
                        </span>
                      ) : (
                        <span>Estoque: {it.product.stock}</span>
                      )}
                    </div>
                    <div className="text-sm">
                      Subtotal:{' '}
                      <span className="font-semibold text-brand">
                        R$ {(it.product.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-1 rounded-2xl bg-black/[0.02] p-2 sm:col-span-1 sm:justify-end sm:bg-transparent sm:p-0">
                    <button
                      onClick={() => updateQty(it, it.quantity - 1)}
                      disabled={disabledRow || it.quantity <= 1}
                      className="btn h-10 w-10 px-0 border border-black/10 dark:border-white/10 disabled:opacity-50"
                      title="Diminuir"
                      aria-label={`Diminuir quantidade de ${it.product.name}`}
                    >
                      <MinusIcon />
                    </button>

                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={it.product.stock > 0 ? it.product.stock : undefined}
                      value={it.quantity}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isFinite(next)) updateQty(it, next);
                      }}
                      className="input-base h-10 w-16 text-center"
                      disabled={disabledRow}
                      aria-label={`Quantidade de ${it.product.name}`}
                    />

                    <button
                      onClick={() => updateQty(it, it.quantity + 1)}
                      disabled={disabledRow || (it.product.stock > 0 && it.quantity >= it.product.stock)}
                      className="btn h-10 w-10 px-0 border border-black/10 dark:border-white/10 disabled:opacity-50"
                      title="Aumentar"
                      aria-label={`Aumentar quantidade de ${it.product.name}`}
                    >
                      <PlusIcon />
                    </button>

                    <button
                      onClick={() => removeItem(it.id)}
                      disabled={disabledRow}
                      className="btn h-10 px-3 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                      title="Remover item"
                      aria-label={`Remover ${it.product.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Rodapé total/ações */}
          <div className="rounded-2xl border p-4 space-y-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
            <div className="flex items-end justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Resumo</p>
                <div className="text-sm text-slate-600 dark:text-slate-300">{totalQty} item(ns) no carrinho</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <div className="text-2xl font-semibold text-brand leading-none">R$ {total.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={clearCart}
                className="btn border border-accent text-accent hover:bg-accent hover:text-white w-full"
                title="Limpar todos os itens do carrinho"
              >
                Limpar carrinho
              </button>
              <button
                onClick={handleFinalize}
                className="btn btn-primary w-full"
                title="Ir para o checkout"
              >
                Finalizar
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
