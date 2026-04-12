"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
  tag?: string | null;
  category?: { id: string; name: string } | null;
};

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Preço inválido"),
  stock: z.coerce.number().int("Estoque deve ser inteiro").nonnegative("Estoque inválido"),
  imageUrl: z.string().url("URL inválida").optional(),
  tag: z.enum(["PROMOCAO", "NOVO"]).optional(),
  categoryName: z.string().optional().nullable(),
});
type ProductFormData = z.infer<typeof productSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  editingProduct: Product | null;
};

export default function ProductFormModal({ open, onClose, onSaveSuccess, editingProduct }: Props) {
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as unknown as Resolver<ProductFormData>,
    defaultValues: { name: "", description: "", price: 0, stock: 0 },
  });

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        description: editingProduct.description ?? "",
        price: editingProduct.price,
        stock: editingProduct.stock,
  tag: editingProduct.tag === 'Promoção' ? 'PROMOCAO' : editingProduct.tag === 'Novo' ? 'NOVO' : undefined,
  categoryName: editingProduct.category?.name ?? null,
      });
      setPreviewUrl(editingProduct.imageUrl ?? "");
      setSelectedImage(null);
    } else {
      reset({ name: "", description: "", price: 0, stock: 0, categoryName: "" });
      setPreviewUrl("");
      setSelectedImage(null);
    }
  }, [editingProduct, reset]);

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
            if (detail) reset((vals) => ({ ...vals, categoryName: detail }));
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
      payload.append('price', String(data.price));
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">{editingProduct ? "Editar produto" : "Novo produto"}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm" htmlFor="name">Nome</label>
              <input id="name" className="input-base" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="price">Preço</label>
              <input id="price" className="input-base" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="stock">Estoque</label>
              <input id="stock" className="input-base" type="number" {...register("stock")} />
              {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
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
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedImage(file);
                  if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                  if (file) setPreviewUrl(URL.createObjectURL(file));
                }}
              />
              <p className="mt-1 text-xs text-slate-500">PNG, JPG ou WEBP ate 5MB.</p>
              {previewUrl && (
                <div className="mt-2 overflow-hidden rounded border border-black/10 dark:border-white/10">
                  <img src={previewUrl} alt="Preview da imagem" className="h-40 w-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="tag">Tag</label>
              <select id="tag" className="input-base" {...register('tag')}>
                <option value="">Nenhuma</option>
                <option value="PROMOCAO">Promoção</option>
                <option value="NOVO">Novo</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm" htmlFor="categoryName">Categoria</label>
              <input
                id="categoryName"
                className="input-base"
                {...register('categoryName')}
                placeholder="ex: roupas, eletronicos"
                onFocus={() => setSuggestionsVisible(true)}
                onBlur={() => setTimeout(() => setSuggestionsVisible(false), 150)}
                onKeyDown={(e) => {
                  const filtered = allCategories.filter((c) => (c.name || '').toLowerCase().includes(String((document.getElementById('categoryName') as HTMLInputElement)?.value ?? '').toLowerCase()));
                  if (e.key === 'ArrowDown') {
                    setActiveIndex((i) => (i === null ? 0 : Math.min(filtered.length - 1, i + 1)));
                    e.preventDefault();
                  } else if (e.key === 'ArrowUp') {
                    setActiveIndex((i) => (i === null ? Math.max(0, filtered.length - 1) : Math.max(0, i - 1)));
                    e.preventDefault();
                  } else if (e.key === 'Enter') {
                    if (activeIndex !== null && filtered[activeIndex]) {
                      const name = filtered[activeIndex].name;
                      reset((vals) => ({ ...vals, categoryName: name }));
                      setSuggestionsVisible(false);
                      e.preventDefault();
                    }
                  }
                }}
              />
              {suggestionsVisible && allCategories.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-auto rounded border z-50 shadow absolute bg-[var(--color-card)] text-[var(--color-text)]" style={{ minWidth: 240, borderColor: 'var(--color-border)' }}>
                  {allCategories
                    .filter((c) => (c.name || '').toLowerCase().includes(String((document.getElementById('categoryName') as HTMLInputElement)?.value ?? '').toLowerCase()))
                    .slice(0, 8)
                    .map((c, idx) => (
                      <li
                        key={c.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-[var(--color-hover)] ${activeIndex === idx ? 'bg-[var(--color-hover)]' : ''}`}
                        onMouseDown={() => {
                          reset((vals) => ({ ...vals, categoryName: c.name }));
                          setSuggestionsVisible(false);
                        }}
                      >
                        {c.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <button disabled={isSubmitting || saving} className="btn btn-primary" aria-disabled={isSubmitting || saving}>
                {isSubmitting || saving ? (editingProduct ? "Salvando…" : "Criando…") : editingProduct ? "Salvar alterações" : "Criar"}
              </button>

              <button type="button" className="btn border border-black/10 dark:border-white/10" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
