"use client";

import Image from 'next/image';
import { useState } from 'react';
// PlusIcon removed; using text label for add button

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
  imageUrl?: string | null;
  tag?: 'Promoção' | 'Novo';
  category?: { id: string; name: string } | null;
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function clsx(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(' ');
}

function highlight(text: string, term: string) {
  if (!term) return text;
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safe})`, 'ig');
  const parts = text.split(re);
  const normalizedTerm = term.toLocaleLowerCase('pt-BR');
  return parts.map((p, i) =>
    p.toLocaleLowerCase('pt-BR') === normalizedTerm ? (
      <mark key={i} className="bg-brand/20 text-brand rounded px-0.5">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

type Props = {
  product: Product;
  searchTerm: string;
  onAddToCart: (productId: string) => Promise<void> | void;
};

import Link from 'next/link';

export default function ProductCard({ product, searchTerm, onAddToCart }: Props) {
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (adding) return;
    try {
      setAdding(true);
      await onAddToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <li className="card p-1 sm:p-2 md:p-3 flex flex-col gap-2 h-full group transform transition-transform duration-150 hover:scale-102 hover:shadow-md focus-within:scale-102 focus-within:shadow-md">
      <Link href={`/products/${product.slug}`} className="group-hover:no-underline"> 
      <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-black/5">
        {/* Badge for tag */}
        {product.tag && (
          <span
            className={clsx(
              'absolute top-2 left-2 z-10 px-2 py-0.5 text-xs font-semibold rounded-md text-white',
              product.tag === 'Promoção' ? 'bg-secondary-red' : 'bg-secondary-green',
            )}
          >
            {product.tag}
          </span>
        )}

        <Image
          src={product.imageUrl ?? '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
          className="object-cover"
        />
  </div>
  </Link>

  <div className="flex-1 min-h-10 md:min-h-12 flex flex-col items-start sm:items-center text-left sm:text-center">
        <Link href={`/products/${product.slug}`} className="w-full">
          <h3 className="font-medium text-sm md:text-sm lg:text-sm xl:text-base leading-snug cursor-pointer">{highlight(product.name, searchTerm.trim())}</h3>
          {product.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 cursor-pointer">
              {product.description}
            </p>
          )}
        </Link>
        {product.category?.name && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{product.category.name}</div>
        )}
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {typeof product.heightCm === 'number' && <span>Altura: {product.heightCm.toFixed(1)} cm</span>}
          {product.wholesaleEnabled && (
            <span className="text-emerald-600 font-medium">
              Venda no atacado ativada · mínimo {product.wholesaleMinQuantity ?? 1} peças
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center flex-col gap-1 w-full">
        <div className="text-sm text-center">
          <div className="font-semibold text-sm md:text-sm lg:text-sm xl:text-base">{formatBRL(product.price)}</div>
          <div
            className={clsx(
              'mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs',
              product.stock > 0
                ? 'bg-secondary-orange/10 text-secondary-orange'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
            )}
            title={`Estoque: ${product.stock}`}
          >
            {product.stock > 0 ? `Estoque: ${product.stock}` : 'Disponível para produção'}
          </div>
        </div>

        {/* Add button: visible only on hover or focus-within */}
        <button
          disabled={adding}
          onClick={(e) => { e.stopPropagation(); handleAdd(); }}
          className={clsx(
            'mt-1 inline-flex items-center justify-center rounded-md bg-brand text-white px-3 py-1.5 text-xs transition-colors',
            'disabled:opacity-60',
          )}
          title={product.stock <= 0 ? 'Adicionar para produção sob demanda' : 'Adicionar ao carrinho'}
          aria-disabled={adding}
        >
          {adding ? '…' : 'Adicionar'}
        </button>
      </div>
    </li>
  );
}
