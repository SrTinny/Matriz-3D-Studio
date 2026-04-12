"use client";

import Image from "next/image";
import Link from "next/link";
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
  category?: { id: string; name: string } | null;
};

type Props = {
  product: Product;
  onEdit: (p: Product) => void;
  onRemove: (id: string) => void;
  removingId?: string | null;
  compact?: boolean;
};

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
};

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23e5e7eb"/></svg>';

export default function ProductAdminCard({ product, onEdit, onRemove, removingId, compact = false }: Props) {
  const src = product.imageUrl || PLACEHOLDER;

  const descLimit = compact ? 60 : 120;
  const rawDesc = product.description ?? '';
  const shortDesc = rawDesc ? (rawDesc.length > descLimit ? rawDesc.slice(0, descLimit).trimEnd() + '…' : rawDesc) : '—';

  return (
    <article
      key={product.id}
      className={"card h-full flex flex-col " + (compact ? 'p-2 space-y-2 text-left justify-between' : 'p-4 space-y-2')}
      aria-label={`Produto ${product.name}`}>

  <div className={"relative " + (compact ? 'h-28' : 'aspect-[3/2]') + " w-full overflow-hidden rounded"} style={{ background: 'var(--color-card)' }}>
        <Image src={src} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 400px" />
      </div>

      <Link href={`/products/${product.id}`} className="no-underline text-inherit flex flex-col flex-grow min-h-0">
        <div className={"flex flex-col " + (compact ? 'gap-1' : 'sm:flex-row sm:items-start sm:justify-between gap-2') + " min-h-0"}>
          <div className="flex flex-col">
            <h3 className={"font-semibold leading-tight " + (compact ? 'text-sm line-clamp-2' : '')} title={product.name}>{product.name}</h3>
            {product.category?.name && <span className="text-xs text-slate-500 dark:text-slate-400">{product.category.name}</span>}
          </div>
          <span className={"text-sm text-slate-600 dark:text-slate-300 " + (compact ? 'text-xs' : '')}>{formatDate(product.updatedAt ?? product.createdAt)}</span>
        </div>

        {/* descricao com clamp para manter altura mais consistente */}
        <div className={"text-sm text-slate-700 dark:text-slate-300 mt-1 flex-grow min-h-0 " + (compact ? 'text-xs' : '')} title={rawDesc}>
          <p className={"m-0 overflow-hidden text-ellipsis " + (compact ? 'line-clamp-2' : 'line-clamp-4')}>{shortDesc || '—'}</p>
        </div>

        {/* footer interno removido para evitar duplicação; o footer real está abaixo do Link */}
      </Link>

      <div className={"mt-2 " + (compact ? 'flex flex-col items-start gap-2' : 'flex items-center justify-between')}>
        <div className="flex flex-col">
          <span className={"text-brand font-semibold " + (compact ? 'text-sm' : '')} style={{ color: 'var(--color-brand)' }}>{formatBRL(product.price)}</span>
          <span className={"text-sm text-slate-600 dark:text-slate-300 " + (compact ? 'text-xs mt-0.5' : 'text-sm mt-0.5')} style={{ color: 'var(--color-text)' }}>Estoque: <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'color-mix(in oklab, var(--color-brand), white 85%)', color: 'var(--color-brand)' }}>{product.stock}</span></span>
        </div>

        {compact ? (
          <div className="w-full mt-0 flex flex-col gap-2">
            <button
              aria-label="Editar produto"
              title="Editar"
              className="btn w-full py-2 rounded-md border border-black/10 dark:border-white/10 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button
              aria-label="Remover produto"
              title="Remover"
              className="btn w-full py-2 rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 flex items-center justify-center"
              disabled={removingId === product.id}
              onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
            >
              {removingId === product.id ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              aria-label="Editar produto"
              title="Editar"
              className="btn p-2 rounded-md border border-black/10 dark:border-white/10"
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button
              aria-label="Remover produto"
              title="Remover"
              className="btn p-2 rounded-md border border-red-600 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
              disabled={removingId === product.id}
              onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
            >
              {removingId === product.id ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
