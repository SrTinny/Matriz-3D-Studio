"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

import type { AdminProduct } from './productTypes';
import { calculatePricingSuggestion, formatBRL } from './pricing';

function emptyToUndefined(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Preço inválido"),
  wholesalePrice: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  wholesaleMinQuantity: z.coerce.number().int().positive("Informe ao menos 1 peça").default(1),
  weightGrams: z.coerce.number().nonnegative("Peso inválido").default(0),
  printHours: z.coerce.number().nonnegative("Horas inválidas").default(0),
  wholesaleEnabled: z.boolean().default(false),
  stock: z.coerce.number().int("Estoque deve ser inteiro").nonnegative("Estoque inválido"),
  tag: z.enum(["PROMOCAO", "NOVO"]).optional(),
  categoryName: z.string().optional().nullable(),
});
type ProductFormData = z.infer<typeof productSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  editingProduct: AdminProduct | null;
};

export default function ProductFormModal({ open, onClose, onSaveSuccess, editingProduct }: Props) {
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting, dirtyFields } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as unknown as Resolver<ProductFormData>,
    defaultValues: { name: "", description: "", price: 0, wholesalePrice: 0, wholesaleMinQuantity: 1, weightGrams: 0, printHours: 0, wholesaleEnabled: false, stock: 0, categoryName: "" },
  });

  const weightGrams = watch('weightGrams');
  const printHours = watch('printHours');
  const wholesaleEnabled = watch('wholesaleEnabled');

  const pricing = useMemo(
    () => calculatePricingSuggestion({ weightGrams: Number(weightGrams ?? 0), printHours: Number(printHours ?? 0) }),
    [weightGrams, printHours],
  );

  const filteredCategories = allCategories
    .filter((c) => (c.name || '').toLowerCase().includes(categoryQuery.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        description: editingProduct.description ?? "",
        price: editingProduct.price,
        wholesalePrice: editingProduct.wholesalePrice ?? 0,
        wholesaleMinQuantity: editingProduct.wholesaleMinQuantity ?? 1,
        weightGrams: editingProduct.weightGrams ?? 0,
        printHours: editingProduct.printHours ?? 0,
        wholesaleEnabled: editingProduct.wholesaleEnabled ?? false,
        stock: editingProduct.stock,
        tag: editingProduct.tag === 'Promoção' ? 'PROMOCAO' : editingProduct.tag === 'Novo' ? 'NOVO' : undefined,
        categoryName: editingProduct.category?.name ?? null,
      });
      setPreviewUrl(editingProduct.imageUrl ?? "");
      setSelectedImage(null);
      setCategoryQuery(editingProduct.category?.name ?? "");
    } else {
      reset({ name: "", description: "", price: 0, wholesalePrice: 0, wholesaleMinQuantity: 1, weightGrams: 0, printHours: 0, wholesaleEnabled: false, stock: 0, categoryName: "" });
      setPreviewUrl("");
      setSelectedImage(null);
      setCategoryQuery("");
    }
  }, [editingProduct, reset]);

  useEffect(() => {
    if (editingProduct) return;

    if (!dirtyFields.price) {
      setValue('price', pricing.retailPrice, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
    }

    if (wholesaleEnabled && !dirtyFields.wholesalePrice) {
      setValue('wholesalePrice', pricing.wholesalePrice, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
    }

    if (wholesaleEnabled && !dirtyFields.wholesaleMinQuantity) {
      setValue('wholesaleMinQuantity', 1, { shouldDirty: false, shouldTouch: false, shouldValidate: true });
    }
  }, [dirtyFields.price, dirtyFields.wholesalePrice, dirtyFields.wholesaleMinQuantity, editingProduct, pricing.retailPrice, pricing.wholesalePrice, setValue, wholesaleEnabled]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // fetch categories for autocomplete
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await api.get('/categories');
        if (!mounted) return;
        setAllCategories(res.data ?? []);
      } catch {}
    })();

    const onCategoriesChanged = (e: Event) => {
      void (async () => {
        try {
          const res = await api.get('/categories');
          if (!mounted) return;
          setAllCategories(res.data ?? []);
          // if event provides a detail with new category name, prefill it
          try {
            const detail = (e as CustomEvent).detail as string | undefined;
            if (detail) {
              reset((vals) => ({ ...vals, categoryName: detail }));
              setCategoryQuery(detail);
            }
          } catch {}
        } catch {}
      })();
    }
    window.addEventListener('categories:changed', onCategoriesChanged as EventListener);

    return () => { mounted = false; window.removeEventListener('categories:changed', onCategoriesChanged as EventListener); };
  }, [reset]);

  async function onSubmit(data: ProductFormData) {
    try {
      setSaving(true);
      const payload = new FormData();
      payload.append('name', data.name);
      payload.append('price', String(Number.isFinite(data.price) ? data.price : pricing.retailPrice));
      payload.append('weightGrams', String(data.weightGrams ?? 0));
      payload.append('printHours', String(data.printHours ?? 0));
      payload.append('wholesaleEnabled', String(Boolean(data.wholesaleEnabled)));
      if (data.wholesaleEnabled) {
        payload.append('wholesalePrice', String(data.wholesalePrice ?? pricing.wholesalePrice));
        payload.append('wholesaleMinQuantity', String(data.wholesaleMinQuantity ?? 1));
      }
      payload.append('stock', String(data.stock));
      if (data.description?.trim()) payload.append('description', data.description.trim());
      if (data.tag) payload.append('tag', data.tag);
      if (data.categoryName?.trim()) payload.append('categoryName', data.categoryName.trim());
      if (selectedImage) payload.append('image', selectedImage);

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success("Produto atualizado");
      } else {
        await api.post("/products", payload);
        toast.success("Produto criado");
      }
      try { window.dispatchEvent(new CustomEvent('categories:changed', { detail: data.categoryName ?? undefined })); } catch {}
      onSaveSuccess();
    } catch (e: unknown) {
      let msg = editingProduct ? "Erro ao atualizar" : "Erro ao criar";
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
        <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {editingProduct ? "Editar produto" : "Novo produto"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados e envie uma imagem com proporção horizontal para melhor resultado.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm" htmlFor="name">Nome</label>
              <input id="name" className="input-base" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="price">Preço varejo</label>
              <input id="price" className="input-base" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="weightGrams">Peso da peça (g)</label>
              <input id="weightGrams" className="input-base" type="number" step="0.01" {...register("weightGrams")} />
              {errors.weightGrams && <p className="mt-1 text-xs text-red-600">{errors.weightGrams.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="printHours">Horas de impressão</label>
              <input id="printHours" className="input-base" type="number" step="0.01" {...register("printHours")} />
              {errors.printHours && <p className="mt-1 text-xs text-red-600">{errors.printHours.message}</p>}
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3">
              <input id="wholesaleEnabled" type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("wholesaleEnabled")} />
              <label htmlFor="wholesaleEnabled" className="text-sm font-medium">Vender no atacado</label>
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="wholesalePrice">Preço atacado</label>
              <input
                id="wholesalePrice"
                className="input-base"
                type="number"
                step="0.01"
                disabled={!wholesaleEnabled}
                {...register("wholesalePrice")}
              />
              {errors.wholesalePrice && <p className="mt-1 text-xs text-red-600">{errors.wholesalePrice.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="wholesaleMinQuantity">Atacado a partir de</label>
              <input
                id="wholesaleMinQuantity"
                className="input-base"
                type="number"
                min={1}
                step="1"
                disabled={!wholesaleEnabled}
                {...register("wholesaleMinQuantity")}
              />
              {errors.wholesaleMinQuantity && <p className="mt-1 text-xs text-red-600">{errors.wholesaleMinQuantity.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="stock">Estoque</label>
              <input id="stock" className="input-base" type="number" {...register("stock")} />
              {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
            </div>

            <div className="sm:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-hover)] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Sugestão de precificação</h3>
                  <p className="text-xs text-slate-500">O cálculo usa peso, horas de impressão, custo de produção e margem de referência.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline px-3 py-2 text-xs" onClick={() => setValue("price", pricing.retailPrice, { shouldDirty: true, shouldValidate: true })}>
                    Usar varejo sugerido
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline px-3 py-2 text-xs"
                    onClick={() => {
                      setValue("wholesaleEnabled", true, { shouldDirty: true, shouldValidate: true });
                      setValue("wholesalePrice", pricing.wholesalePrice, { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    Usar atacado sugerido
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Varejo sugerido</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{formatBRL(pricing.retailPrice)}</div>
                  <div className="mt-2 text-xs text-slate-500">Base de produção: {formatBRL(pricing.productionCost)}.</div>
                </div>

                <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 ${wholesaleEnabled ? '' : 'opacity-80'}`}>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Atacado sugerido</div>
                  <div className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{formatBRL(pricing.wholesalePrice)}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Fica disponível quando a venda no atacado estiver ativada.
                    <br />
                    Quantidade mínima atual: {wholesaleEnabled ? `${watch('wholesaleMinQuantity') ?? 1} peças` : 'desativado'}.
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm" htmlFor="description">Descrição</label>
              <textarea id="description" className="input-base" rows={3} {...register("description")} />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm" htmlFor="imageFile">Imagem do produto</label>
              <input
                id="imageFile"
                className="input-base"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedImage(file);

                  if (previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                  }

                  if (file) {
                    setPreviewUrl(URL.createObjectURL(file));
                  } else if (editingProduct?.imageUrl) {
                    setPreviewUrl(editingProduct.imageUrl);
                  } else {
                    setPreviewUrl("");
                  }
                }}
              />
              <p className="mt-1 text-xs text-slate-500">PNG, JPG ou WEBP até 5MB.</p>

              <div className="mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-hover)]">
                <div className="relative aspect-[16/9] w-full">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview da imagem" fill sizes="(max-width: 768px) 100vw, 700px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      Nenhuma imagem selecionada
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="tag">Tag</label>
              <select id="tag" className="input-base" {...register('tag')}>
                <option value="">Nenhuma</option>
                <option value="PROMOCAO">Promoção</option>
                <option value="NOVO">Novo</option>
              </select>
            </div>

            <div className="relative">
              <label className="mb-1 block text-sm" htmlFor="categoryName">Categoria</label>
              <input
                id="categoryName"
                className="input-base"
                {...register('categoryName')}
                value={categoryQuery}
                placeholder="ex: roupas, eletronicos"
                onFocus={() => {
                  setSuggestionsVisible(true);
                  setActiveIndex(null);
                }}
                onChange={(e) => {
                  const next = e.target.value;
                  setCategoryQuery(next);
                  setValue('categoryName', next);
                }}
                onBlur={() => setTimeout(() => setSuggestionsVisible(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    setActiveIndex((i) => (i === null ? 0 : Math.min(filteredCategories.length - 1, i + 1)));
                    e.preventDefault();
                  } else if (e.key === 'ArrowUp') {
                    setActiveIndex((i) => (i === null ? Math.max(0, filteredCategories.length - 1) : Math.max(0, i - 1)));
                    e.preventDefault();
                  } else if (e.key === 'Enter') {
                    if (activeIndex !== null && filteredCategories[activeIndex]) {
                      const name = filteredCategories[activeIndex].name;
                      setCategoryQuery(name);
                      setValue('categoryName', name);
                      setSuggestionsVisible(false);
                      e.preventDefault();
                    }
                  }
                }}
              />

              {suggestionsVisible && filteredCategories.length > 0 && (
                <ul className="absolute left-0 right-0 z-50 mt-1 max-h-44 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
                  {filteredCategories.map((c, idx) => (
                    <li
                      key={c.id}
                      className={`cursor-pointer px-3 py-2 text-sm hover:bg-[var(--color-hover)] ${activeIndex === idx ? 'bg-[var(--color-hover)]' : ''}`}
                      onMouseDown={() => {
                        setCategoryQuery(c.name);
                        setValue('categoryName', c.name);
                        setSuggestionsVisible(false);
                      }}
                    >
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>

            <button disabled={isSubmitting || saving} className="btn btn-primary" aria-disabled={isSubmitting || saving}>
              {isSubmitting || saving ? (editingProduct ? "Salvando..." : "Criando...") : editingProduct ? "Salvar alterações" : "Criar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
