'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth-store';
import { toast } from 'sonner';

type Product = { id: string; name: string; price: number };
type Seller = { id: string; name: string; email: string };
type Sale = { id: string; total: number; paymentMethod: string; status: string; dueDate?: string | null; customerName?: string | null; createdAt: string; seller: Seller; items: Array<{ quantity: number; productName: string; product?: { name: string } | null }> };
type Summary = { year: number; total: number; count: number; pending: number; byMonth: Array<{ month: number; total: number; count: number }> };

const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const paymentLabels: Record<string, string> = { PIX: 'Pix', CARD: 'Cartão', CASH: 'Dinheiro', TRANSFER: 'Transferência', OTHER: 'Outro' };
const statusLabels: Record<string, string> = { PENDING: 'Pendente', IN_PROGRESS: 'Em produção', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' };

export default function SalesClient() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: '', productName: '', quantity: '1', total: '', paymentMethod: 'PIX', sellerId: '', customerName: '', customerContact: '', status: 'PENDING', dueDate: '', notes: '' });

  const selectedProduct = useMemo(() => products.find((product) => product.id === form.productId), [products, form.productId]);

  useEffect(() => {
    void (async () => {
      const currentUser = await hydrateSession();
      if (!currentUser) { window.location.href = '/login'; return; }
      if (currentUser.role !== 'ADMIN') { toast.error('Acesso restrito a administradores.'); window.location.href = '/products'; return; }
      setUser(currentUser);
      setForm((current) => ({ ...current, sellerId: currentUser.id }));
      setReady(true);
    })();
  }, []);

  async function loadData() {
    if (!ready) return;
    try {
      setLoading(true);
      const [productsRes, sellersRes, salesRes, summaryRes] = await Promise.all([
        api.get('/products', { params: { page: 1, perPage: 50, sort: 'name_asc' } }),
        api.get('/sales/sellers'),
        api.get('/sales', { params: { page: 1, perPage: 30, status: statusFilter || undefined } }),
        api.get('/sales/summary', { params: { year } }),
      ]);
      setProducts(productsRes.data?.items ?? []);
      setSellers(sellersRes.data ?? []);
      setSales(salesRes.data?.items ?? []);
      setSummary(summaryRes.data ?? null);
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      toast.error(message ?? 'Não foi possível carregar as vendas.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadData(); }, [ready, statusFilter, year]);

  function updateForm(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function createSale(event: FormEvent) {
    event.preventDefault();
    if (!form.productName.trim() || !form.total) { toast.error('Informe o nome do produto e o valor da venda.'); return; }
    try {
      setSaving(true);
      await api.post('/sales', { ...form, productId: form.productId || null, productName: form.productName.trim(), quantity: Number(form.quantity), total: Number(form.total), dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00.000Z`).toISOString() : null });
      toast.success('Venda cadastrada.');
      setForm((current) => ({ ...current, productId: '', productName: '', quantity: '1', total: '', customerName: '', customerContact: '', dueDate: '', notes: '' }));
      await loadData();
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;
      toast.error(message ?? 'Não foi possível cadastrar a venda.');
    } finally { setSaving(false); }
  }

  async function changeStatus(id: string, status: string) {
    try { await api.patch(`/sales/${id}/status`, { status }); toast.success('Status atualizado.'); await loadData(); }
    catch { toast.error('Não foi possível atualizar o status.'); }
  }

  if (!ready || !user) return null;

  return (
    <main className="container mx-auto max-w-screen-xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-brand">Admin • Vendas</h1><p className="text-sm text-slate-600">Cadastre vendas e acompanhe prazos, status e faturamento.</p></div>
        <a href="/admin/products" className="btn btn-outline">Voltar aos produtos</a>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-slate-500">Faturamento em {year}</p><strong className="mt-2 block text-2xl">{formatBRL(summary?.total ?? 0)}</strong></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Vendas no ano</p><strong className="mt-2 block text-2xl">{summary?.count ?? 0}</strong></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Pendentes / em produção</p><strong className="mt-2 block text-2xl">{summary?.pending ?? 0}</strong></div>
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Cadastrar nova venda</h2>
        <form onSubmit={createSale} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm"><span>Produto</span><input className="input-base" list="sale-products" value={form.productName} onChange={(event) => { const name = event.target.value; const product = products.find((item) => item.name.toLowerCase() === name.toLowerCase()); setForm((current) => ({ ...current, productName: name, productId: product?.id ?? '', total: product ? String(product.price) : current.total })); }} placeholder="Digite o nome do produto" required /><datalist id="sale-products">{products.map((product) => <option key={product.id} value={product.name}>{formatBRL(product.price)}</option>)}</datalist></label>
          <label className="space-y-1 text-sm"><span>Quantidade</span><input className="input-base" type="number" min="1" value={form.quantity} onChange={(event) => updateForm('quantity', event.target.value)} /></label>
          <label className="space-y-1 text-sm"><span>Valor total (R$)</span><input className="input-base" type="number" min="0.01" step="0.01" value={form.total} onChange={(event) => updateForm('total', event.target.value)} required /></label>
          <label className="space-y-1 text-sm"><span>Forma de pagamento</span><select className="input-base" value={form.paymentMethod} onChange={(event) => updateForm('paymentMethod', event.target.value)}>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>Vendedor</span><select className="input-base" value={form.sellerId} onChange={(event) => updateForm('sellerId', event.target.value)}>{sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>Status</span><select className="input-base" value={form.status} onChange={(event) => updateForm('status', event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>Cliente</span><input className="input-base" value={form.customerName} onChange={(event) => updateForm('customerName', event.target.value)} placeholder="Nome (opcional)" /></label>
          <label className="space-y-1 text-sm"><span>Contato do cliente</span><input className="input-base" value={form.customerContact} onChange={(event) => updateForm('customerContact', event.target.value)} placeholder="Telefone ou e-mail" /></label>
          <label className="space-y-1 text-sm"><span>Prazo de entrega</span><input className="input-base" type="date" value={form.dueDate} onChange={(event) => updateForm('dueDate', event.target.value)} /></label>
          <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-3"><span>Observações</span><textarea className="input-base min-h-20" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Detalhes da produção, entrega ou pagamento" /></label>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3"><button className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar venda'}</button>{selectedProduct && <span className="text-sm text-slate-500">Preço sugerido: {formatBRL(selectedProduct.price)}</span>}</div>
        </form>
      </section>

      <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="text-lg font-semibold">Histórico de vendas</h2><p className="text-sm text-slate-500">Acompanhe pedidos concluídos e pendentes.</p></div><div className="flex gap-2"><select className="input-base w-auto" value={year} onChange={(event) => setYear(Number(event.target.value))}><option>{year - 1}</option><option>{year}</option><option>{year + 1}</option></select><select className="input-base w-auto" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Data</th><th className="p-3">Produto</th><th className="p-3">Cliente</th><th className="p-3">Vendedor</th><th className="p-3">Pagamento</th><th className="p-3">Total</th><th className="p-3">Prazo / status</th></tr></thead><tbody>{loading ? <tr><td className="p-6" colSpan={7}>Carregando vendas...</td></tr> : sales.length === 0 ? <tr><td className="p-6 text-center text-slate-500" colSpan={7}>Nenhuma venda cadastrada.</td></tr> : sales.map((sale) => <tr key={sale.id} className="border-t"><td className="p-3">{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</td><td className="p-3">{sale.items.map((item) => `${item.quantity}x ${item.productName || item.product?.name || 'Produto'}`).join(', ')}</td><td className="p-3">{sale.customerName || 'Não informado'}</td><td className="p-3">{sale.seller.name}</td><td className="p-3">{paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}</td><td className="p-3 font-semibold">{formatBRL(sale.total)}</td><td className="p-3"><div className="flex items-center gap-2"><span className="whitespace-nowrap">{sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</span><select className="input-base min-w-32" value={sale.status} onChange={(event) => void changeStatus(sale.id, event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></td></tr>)}</tbody></table></div></section>
    </main>
  );
}