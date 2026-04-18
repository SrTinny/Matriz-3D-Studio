"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import axios from "axios";
import { hydrateSession } from "@/lib/auth";
import { toast } from "sonner";
import ProductFormModal from './ProductFormModal';
import ProductAdminCard from './ProductAdminCard';
import ProductTableRow from './ProductTableRow';
import DashboardStats from './DashboardStats';
import PaginationControls from './PaginationControls';
import type { AdminProduct } from './productTypes';

/* helpers removed: moved to row/card components */

export default function AdminProductsPage() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOnlyOutOfStock, setShowOnlyOutOfStock] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Persistir preferência de densidade no localStorage
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

  // Guard (auth + role)
  useEffect(() => {
    let mounted = true;

    void (async () => {
      const user = await hydrateSession();
      if (!mounted) return;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.role !== "ADMIN") {
        toast.error("Acesso restrito a administradores.");
        window.location.href = "/products";
        return;
      }

      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);



  // Debounce da busca
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const filteredItems = showOnlyOutOfStock ? items.filter((p) => p.stock === 0) : items;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get("/products", {
        params: { page, perPage, search: debouncedSearch || undefined },
      });
      const items = (res.data?.items ?? []) as AdminProduct[];
      const totalItems = Number(res.data?.totalItems ?? res.data?.total ?? items.length ?? 0);
      const totalPages = Number(
        res.data?.totalPages ??
          (perPage > 0 ? Math.max(1, Math.ceil(totalItems / perPage)) : 1),
      );

      setItems(items);
      setTotalItems(totalItems);
      setTotalPages(totalPages);
    } catch (e: unknown) {
      let msg = "Erro ao carregar produtos";
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, perPage]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // reset page when perPage changes
  useEffect(() => {
    setPage(1);
  }, [perPage]);

  

  function startCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function startEdit(p: AdminProduct) {
    setEditing(p);
    setModalOpen(true);
  }

  // onSaveSuccess: usado pelo modal para fechar + reload
  function handleSaveSuccess() {
    setModalOpen(false);
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Remover produto?")) return;
    try {
      setRemovingId(id);
      await api.delete(`/products/${id}`);
      toast.success("Produto removido");
      // otimista: remove local antes do reload para resposta visual rápida
      setItems((prev) => prev.filter((p) => p.id !== id));
      await load();
    } catch (e: unknown) {
      let msg = "Erro ao remover";
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  }

  // Handlers para InlineEditCell
  async function handleSavePrice(id: string, newPrice: number) {
    try {
      console.debug("handleSavePrice start", { id, newPrice });
      const res = await api.patch(`/products/${id}`, { price: newPrice });
      console.debug("handleSavePrice response", res?.data);
      toast.success('Preço atualizado');
      await load();
      console.debug("handleSavePrice load finished");
    } catch (e: unknown) {
      console.error("handleSavePrice error", e);
      let msg = 'Erro ao atualizar preço';
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    }
  }

  async function handleSaveStock(id: string, newStock: number) {
    try {
      console.debug("handleSaveStock start", { id, newStock });
      const res = await api.patch(`/products/${id}`, { stock: newStock });
      console.debug("handleSaveStock response", res?.data);
      toast.success('Estoque atualizado');
      await load();
      console.debug("handleSaveStock load finished");
    } catch (e: unknown) {
      console.error("handleSaveStock error", e);
      let msg = 'Erro ao atualizar estoque';
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    }
  }

  // logout gerenciado pelo HeaderBar global

  if (!ready) return null;

  return (
    <main className="container mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header (apenas título/descritivo); ações globais no HeaderBar */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand">Admin • Produtos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Gerencie catálogo, varejo, atacado e estoque.
          </p>
        </div>
      </header>

  {/* Dashboard stats */}
  <DashboardStats items={items} loading={loading} onFilterOutOfStock={() => setShowOnlyOutOfStock((s) => !s)} activeFilter={showOnlyOutOfStock} />

      {/* Toolbar de busca */}
      <section className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="search" className="sr-only">
            Buscar por nome
          </label>
          <input
            id="search"
            className="input-base flex-1 min-w-0"
            placeholder="Buscar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar produtos por nome"
          />
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:justify-end">
              <button onClick={load} className="btn btn-primary whitespace-nowrap">
                {loading ? "Buscando…" : "Buscar"}
              </button>
              {/* compact toggle intentionally removed from responsive UI per request */}
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="input-base w-full sm:w-auto"
                aria-label="Itens por página"
              >
                <option value={10}>10 / página</option>
                <option value={25}>25 / página</option>
                <option value={50}>50 / página</option>
              </select>
              <button
                onClick={startCreate}
                className="btn border border-black/10 dark:border-white/10 whitespace-nowrap w-full sm:w-auto"
              >
                Novo produto
              </button>
          </div>
        </div>
        <div className="mt-2 min-h-5 text-sm text-red-600" role="status" aria-live="polite">
          {errorMsg ?? ""}
        </div>
      </section>

      {/* Lista mobile (cards) */}
      {!loading && filteredItems.length > 0 && (
        <>
          {showOnlyOutOfStock && (
            <div className="text-sm text-slate-600 mb-2">Filtro: <strong>Somente sem estoque</strong></div>
          )}
          {/* Mobile card grid: compactMode => 3 cols, comfortable => 2 cols (responsive) */}
          <section className={"grid gap-3 md:hidden items-stretch auto-rows-fr " + (compactMode ? 'grid-cols-3 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2')}>
            {filteredItems.map((p) => (
              <ProductAdminCard key={p.id} product={p} onEdit={startEdit} onRemove={remove} removingId={removingId} compact={compactMode} />
            ))}
          </section>
        </>
      )}

      {/* Lista desktop (tabela) */}
      <section className="card overflow-hidden hidden md:block">
        <div className="overflow-auto max-h-[58dvh]">
          <div className="min-w-full">
          <table className="w-full text-sm [display:table] table-auto">
            <thead className="sticky top-0 backdrop-blur theme-card-bg">
              <tr className="[&>th]:p-3 [&>th]:text-left [&>th]:font-semibold text-slate-700 dark:text-slate-200">
                <th>Imagem</th>
                <th>Nome</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th className="hidden lg:table-cell">Atualizado</th>
                <th>Descrição</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-black/5 dark:[&>tr]:border-white/10">
              {/* estados */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3">
                      <div className="h-10 w-10 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-40 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-20 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-20 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                    <td className="hidden p-3 lg:table-cell">
                      <div className="h-4 w-40 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                    <td className="p-3">
                      <div className="ml-auto h-8 w-28 rounded" style={{ background: 'var(--color-border)' }} />
                    </td>
                  </tr>
                ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-600 dark:text-slate-300" colSpan={7}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredItems.map((p) => (
                  <ProductTableRow key={p.id} product={p} onEdit={startEdit} onRemove={remove} removingId={removingId} onSavePrice={handleSavePrice} onSaveStock={handleSaveStock} />
                ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* Product form moved to modal */}
      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} editingProduct={editing} onSaveSuccess={handleSaveSuccess} />

      {/* Pagination controls */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-sm text-slate-600">Total: {totalItems} itens</div>
        <div>
          <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={(n) => setPage(n)} loading={loading} />
        </div>
      </div>
    </main>
  );
}
