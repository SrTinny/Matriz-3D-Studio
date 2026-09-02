"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import axios from "axios";
import { hydrateSession } from "@/lib/auth";
import { toast } from "sonner";
import ProductFormModal from './ProductFormModal';
import ProductAdminCard from './ProductAdminCard';
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
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
              <button onClick={load} className="btn btn-primary w-full whitespace-nowrap sm:w-auto">
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
                onClick={() => window.location.href = '/admin/orcamento'}
                className="btn btn-outline w-full whitespace-nowrap sm:w-auto"
              >
                Calculadora de orçamento
              </button>
              <button
                onClick={() => window.location.href = '/admin/vendas'}
                className="btn btn-outline w-full whitespace-nowrap sm:w-auto"
              >
                Nova venda / histórico
              </button>
              <button
                onClick={startCreate}
                className="btn w-full whitespace-nowrap border border-black/10 dark:border-white/10 sm:w-auto"
              >
                Novo produto
              </button>
          </div>
        </div>
        <div className="mt-2 min-h-5 text-sm text-red-600" role="status" aria-live="polite">
          {errorMsg ?? ""}
        </div>
      </section>

      {showOnlyOutOfStock && (
        <div className="text-sm text-slate-600">Filtro: <strong>Somente sem estoque</strong></div>
      )}

      <section className="card overflow-hidden">
        <div className="max-h-[68dvh] overflow-y-auto p-3 sm:p-4">
          {loading && <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />)}</div>}
          {!loading && filteredItems.length === 0 && <p className="p-6 text-center text-slate-600 dark:text-slate-300">Nenhum produto encontrado.</p>}
          {!loading && filteredItems.length > 0 && <div className="space-y-3">
            {filteredItems.map((p) => (
              <ProductAdminCard key={p.id} product={p} onEdit={startEdit} onRemove={remove} removingId={removingId} />
            ))}
          </div>}
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
