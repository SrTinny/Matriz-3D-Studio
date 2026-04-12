"use client";

import React from "react";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
};

type Props = {
  items: Product[];
  loading?: boolean;
  onFilterOutOfStock?: () => void;
  activeFilter?: boolean;
};

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export default function DashboardStats({ items, loading, onFilterOutOfStock, activeFilter }: Props) {
  const total = items.length;
  const outOfStock = items.filter((p) => p.stock === 0).length;
  const totalValue = items.reduce((acc, p) => acc + (p.price * (p.stock ?? 0)), 0);
  const maxPrice = items.length ? Math.max(...items.map((p) => p.price)) : 0;

  if (loading) {
    return (
      <section aria-label="Estatísticas do catálogo" className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-3 h-8 w-20 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <>
      {/* Mobile layout: valor total em estoque por cima, os outros três em uma linha abaixo */}
      <section aria-label="Estatísticas do catálogo" className="md:hidden space-y-4">
        <div className="card p-4">
          <div className="text-sm text-slate-500">Valor total em estoque</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatBRL(totalValue)}</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-3 text-center">
            <div className="text-sm text-slate-500">Total de produtos</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{total}</div>
          </div>

          <button
            type="button"
            onClick={onFilterOutOfStock}
            className={`card p-3 text-center cursor-pointer ${outOfStock > 0 ? 'hover:shadow-md' : ''} ${activeFilter ? 'ring-2 ring-brand/60 border-brand' : ''}`}
            aria-pressed={!!activeFilter}
          >
            <div className="text-sm text-slate-500">Itens sem estoque</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{outOfStock}</div>
          </button>

          <div className="card p-3 text-center">
            <div className="text-sm text-slate-500">Produto mais caro</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{items.length ? formatBRL(maxPrice) : '—'}</div>
          </div>
        </div>
      </section>

      {/* Desktop layout: mantém o grid existente para >= md */}
      <section aria-label="Estatísticas do catálogo" className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-slate-500">Total de produtos</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{total}</div>
        </div>

        <button
          type="button"
          onClick={onFilterOutOfStock}
          className={`card p-4 text-left cursor-pointer ${outOfStock > 0 ? 'hover:shadow-md' : ''} ${activeFilter ? 'ring-2 ring-brand/60 border-brand' : ''}`}
          aria-pressed={!!activeFilter}
        >
          <div className="text-sm text-slate-500">Itens sem estoque</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{outOfStock}</div>
        </button>

        <div className="card p-4">
          <div className="text-sm text-slate-500">Valor total em estoque</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatBRL(totalValue)}</div>
        </div>

        <div className="card p-4">
          <div className="text-sm text-slate-500">Produto mais caro</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{items.length ? formatBRL(maxPrice) : "—"}</div>
        </div>
      </section>
    </>
  );
}
