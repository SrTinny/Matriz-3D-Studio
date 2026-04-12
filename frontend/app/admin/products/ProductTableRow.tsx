"use client";

import Image from "next/image";
import React, { useState } from "react";
import InlineEditCell from './InlineEditCell';

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
  product: Product;
  onEdit: (p: Product) => void;
  onRemove: (id: string) => void;
  removingId?: string | null;
  onSavePrice?: (id: string, newPrice: number) => Promise<void>;
  onSaveStock?: (id: string, newStock: number) => Promise<void>;
};

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
};

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" fill="%23e5e7eb"/></svg>';

export default function ProductTableRow({ product, onEdit, onRemove, removingId, onSavePrice, onSaveStock }: Props) {
  const [expanded, setExpanded] = useState(false);
  const src = product.imageUrl || PLACEHOLDER;

  return (
    <>
      <tr
        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        onClick={() => setExpanded((s) => !s)}
        aria-expanded={expanded}
      >
      <td className="p-3">
        <Image src={src} alt={product.name} width={56} height={56} className="rounded" />
      </td>
      <td className="p-3 font-medium">{product.name}</td>
      <td className="p-3">
        <InlineEditCell
          value={product.price}
          inputType="number"
          displayFormatter={(v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))}
          onSave={async (newVal) => {
            if (onSavePrice) await onSavePrice(product.id, Number(newVal));
          }}
        />
      </td>
      <td className="p-3">
        <InlineEditCell
          value={product.stock}
          inputType="number"
          onSave={async (newVal) => {
            if (onSaveStock) await onSaveStock(product.id, Number(newVal));
          }}
        />
      </td>
      <td className="hidden p-3 text-slate-600 dark:text-slate-300 lg:table-cell">
        {formatDate(product.updatedAt ?? product.createdAt)}
      </td>
      <td className="hidden p-3 text-slate-600 dark:text-slate-300 lg:table-cell">{product.description ?? "—"}</td>
      <td className="p-3">
        <div className="flex justify-end gap-2 flex-col sm:flex-row">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-black/10 rounded-md w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            Editar
            <span className="sr-only">Editar {product.name}</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white disabled:opacity-50 w-full sm:w-auto"
            disabled={removingId === product.id}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(product.id);
            }}
          >
            {removingId === product.id ? "Removendo…" : "Remover"}
          </button>
        </div>
      </td>
    </tr>

    {/* details row for md (progressive disclosure). Hidden on large screens where description column is visible */}
    <tr className={`${expanded ? '' : 'hidden'} lg:hidden theme-card-bg`}>
      <td colSpan={7} className="p-3 border-t text-sm text-slate-700 dark:text-slate-300">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-slate-600">{product.description ?? "—"}</div>
          <div className="text-xs text-slate-500">Atualizado: {formatDate(product.updatedAt ?? product.createdAt)}</div>
        </div>
      </td>
    </tr>
    </>
  );
}
