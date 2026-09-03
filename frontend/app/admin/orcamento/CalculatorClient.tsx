'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import axios from 'axios';
import { hydrateSession } from '@/lib/auth';
import { toast } from 'sonner';

const DEFAULT_PROFIT_VALUES = [50, 100, 150, 200, 300, 400, 500];

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);

const roundCurrency = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Calculation = {
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  failureCost: number;
  extraCosts: number;
  productionCost: number;
  productionUnitCost: number;
  traysNeeded: number;
  productionFinalCost: number;
  rows: Array<{ percent: number; price: number; gain: number; }>; 
};

type CategoryOption = { id: string; name: string };

export default function CalculatorClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [weightGrams, setWeightGrams] = useState(120);
  const [printHours, setPrintHours] = useState(4);
  const [printMinutes, setPrintMinutes] = useState(0);
  const [filamentCost, setFilamentCost] = useState(0.08);
  const [extraCosts, setExtraCosts] = useState(0);
  const [unitsPerTray, setUnitsPerTray] = useState(1);
  const [totalPieces, setTotalPieces] = useState(1);
  const [customProfit, setCustomProfit] = useState('');
  const [selectedProfit, setSelectedProfit] = useState(100);

  const [productName, setProductName] = useState('Produto calculado');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [finalPrice, setFinalPrice] = useState('');
  const [productStock, setProductStock] = useState(1);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const user = await hydrateSession();
      if (!mounted) return;

      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (user.role !== 'ADMIN') {
        toast.error('Acesso restrito a administradores.');
        window.location.href = '/products';
        return;
      }

      setReady(true);
      try {
        const response = await api.get<CategoryOption[]>('/categories');
        if (mounted) setCategories(response.data ?? []);
      } catch {
        if (mounted) setCategories([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const calculation = useMemo<Calculation>(() => {
    const totalHours = printHours + printMinutes / 60;
    const materialCost = weightGrams * filamentCost;
    const energyCost = totalHours * 0.1 * 1.1;
    const depreciationCost = totalHours * 0.9;
    const failureCost = (materialCost + energyCost + depreciationCost) * 0.08;
    const extraPerTray = extraCosts * Math.max(1, unitsPerTray);
    const productionCost = materialCost + energyCost + depreciationCost + failureCost + extraPerTray;
    const unitCost = productionCost / Math.max(1, unitsPerTray);
    const traysNeeded = Math.max(1, Math.ceil(Math.max(1, totalPieces) / Math.max(1, unitsPerTray)));
    const productionFinalCost = unitCost * Math.max(1, totalPieces);

    const profitValues = [...DEFAULT_PROFIT_VALUES];
    const customValue = Number(String(customProfit).replace(',', '.'));
    if (Number.isFinite(customValue) && customValue > 0 && !profitValues.includes(customValue)) {
      profitValues.push(customValue);
    }

    const rows = profitValues
      .sort((a, b) => a - b)
      .map((percent) => {
        const price = roundCurrency(productionFinalCost * (1 + percent / 100));
        const gain = roundCurrency(price - productionFinalCost);
        return { percent, price, gain };
      });

    if (!rows.some((row) => row.percent === selectedProfit)) {
      setSelectedProfit(rows[0]?.percent ?? 100);
    }

    return {
      materialCost: roundCurrency(materialCost),
      energyCost: roundCurrency(energyCost),
      depreciationCost: roundCurrency(depreciationCost),
      failureCost: roundCurrency(failureCost),
      extraCosts: roundCurrency(extraPerTray),
      productionCost: roundCurrency(productionCost),
      productionUnitCost: roundCurrency(unitCost),
      traysNeeded,
      productionFinalCost: roundCurrency(productionFinalCost),
      rows,
    };
  }, [weightGrams, printHours, printMinutes, filamentCost, extraCosts, unitsPerTray, totalPieces, customProfit, selectedProfit]);

  const selectedRow = calculation.rows.find((row) => row.percent === selectedProfit) ?? calculation.rows[0];
  const targetPrice = selectedRow?.price ?? calculation.productionFinalCost;

  useEffect(() => {
    setFinalPrice(String(targetPrice));
  }, [targetPrice]);

  const summaryText = useMemo(() => {
    const totalHours = printHours + printMinutes / 60;
    return [
      'Resumo de precificação 3D',
      `Peso: ${weightGrams} g`,
      `Tempo de impressão: ${printHours}h ${printMinutes}min`,
      `Custo do filamento: ${formatBRL(filamentCost)} por g`,
      `Outros custos por peça: ${formatBRL(extraCosts)}`,
      `Peças por bandeja: ${unitsPerTray}`,
      `Total de peças: ${totalPieces}`,
      '',
      `Custo da bandeja: ${formatBRL(calculation.productionCost)}`,
      `Custo por unidade: ${formatBRL(calculation.productionUnitCost)}`,
      `Bandejas necessárias: ${calculation.traysNeeded}`,
      `Custo final de produção: ${formatBRL(calculation.productionFinalCost)}`,
      '',
      `Lucro selecionado: ${selectedProfit}%`,
      `Preço sugerido: ${formatBRL(targetPrice)}`,
      `Ganho estimado: ${formatBRL((selectedRow?.gain ?? 0))}`,
      `Tempo total: ${totalHours.toFixed(2)}h`,
    ].join('\n');
  }, [weightGrams, printHours, printMinutes, filamentCost, extraCosts, unitsPerTray, totalPieces, calculation, selectedProfit, targetPrice, selectedRow]);

  async function copySummary() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summaryText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success('Resumo copiado com sucesso.');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  }

  async function createProduct() {
    if (!productName.trim()) {
      toast.error('Informe o nome do produto para cadastrar.');
      return;
    }

    try {
      setSavingProduct(true);

      const payload = {
        name: productName.trim(),
        description: productDescription.trim() || undefined,
        price: Number(finalPrice.replace(',', '.')) || 0,
        stock: Math.max(1, Number(productStock) || 1),
        weightGrams: Number(weightGrams) || 0,
        printHours: Number(printHours + printMinutes / 60) || 0,
        categoryName: productCategory.trim() || undefined,
        categoryNames: productCategory.trim() ? [productCategory.trim()] : undefined,
        wholesaleEnabled: false,
      };

      const res = await api.post('/products', payload);
      toast.success('Produto cadastrado com sucesso!');
      const createdId = (res.data as { id?: string })?.id;
      if (createdId) {
        router.push('/admin/products');
      }
    } catch (e: unknown) {
      let msg = 'Erro ao cadastrar produto';
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string })?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setSavingProduct(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="container mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/75">Admin</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand">Calculadora de orçamento</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => router.push('/admin/products')} className="btn btn-outline">
            Voltar ao painel
          </button>
          <button type="button" onClick={copySummary} className="btn btn-primary">
            Copiar resumo
          </button>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Dados do projeto</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Peso da peça (g)</span>
                <input className="input-base" type="number" min={0} value={weightGrams} onChange={(e) => setWeightGrams(clamp(Number(e.target.value || 0), 0, 50000))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Tempo (h)</span>
                <input className="input-base" type="number" min={0} value={printHours} onChange={(e) => setPrintHours(clamp(Number(e.target.value || 0), 0, 1000))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Tempo (min)</span>
                <input className="input-base" type="number" min={0} max={59} value={printMinutes} onChange={(e) => setPrintMinutes(clamp(Number(e.target.value || 0), 0, 59))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Custo do filamento (R$/g)</span>
                <input className="input-base" type="number" min={0} step="0.01" value={filamentCost} onChange={(e) => setFilamentCost(clamp(Number(e.target.value || 0), 0, 10))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Outros custos por peça (R$)</span>
                <input className="input-base" type="number" min={0} step="0.01" value={extraCosts} onChange={(e) => setExtraCosts(clamp(Number(e.target.value || 0), 0, 2000))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Peças por bandeja</span>
                <input className="input-base" type="number" min={1} value={unitsPerTray} onChange={(e) => setUnitsPerTray(clamp(Number(e.target.value || 1), 1, 200))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300 sm:col-span-2 xl:col-span-1">
                <span className="mb-1 block font-medium">Total de peças</span>
                <input className="input-base" type="number" min={1} value={totalPieces} onChange={(e) => setTotalPieces(clamp(Number(e.target.value || 1), 1, 100000))} />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300 sm:col-span-2 xl:col-span-1">
                <span className="mb-1 block font-medium">Lucro personalizado (%)</span>
                <input className="input-base" type="number" min={0} step="0.01" value={customProfit} placeholder="Ex.: 250" onChange={(e) => {
                  const value = e.target.value;
                  setCustomProfit(value);
                  const parsed = Number(value.replace(',', '.'));
                  if (Number.isFinite(parsed) && parsed > 0) {
                    setSelectedProfit(parsed);
                  }
                }} />
              </label>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Sugestões de preço</h2>
              <button type="button" onClick={() => {
                setWeightGrams(120);
                setPrintHours(4);
                setPrintMinutes(0);
                setFilamentCost(0.08);
                setExtraCosts(0);
                setUnitsPerTray(1);
                setTotalPieces(1);
                setCustomProfit('');
                setSelectedProfit(100);
              }} className="text-xs font-medium text-brand hover:underline">
                Restaurar padrões
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/40">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Lucro</th>
                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Preço</th>
                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.rows.map((row) => (
                    <tr
                      key={row.percent}
                      onClick={() => setSelectedProfit(row.percent)}
                      className={`cursor-pointer transition-colors ${selectedProfit === row.percent ? 'bg-brand/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}
                    >
                      <td className="p-3 font-medium">{row.percent}%</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{formatBRL(row.price)}</td>
                      <td className={`p-3 font-semibold ${row.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatBRL(row.gain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Resumo</h2>

            <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Material</span><strong>{formatBRL(calculation.materialCost)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Energia</span><strong>{formatBRL(calculation.energyCost)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Depreciação</span><strong>{formatBRL(calculation.depreciationCost)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Falhas</span><strong>{formatBRL(calculation.failureCost)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Custo extra</span><strong>{formatBRL(calculation.extraCosts)}</strong></div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-2 text-sm"><span className="text-slate-500">Custo da bandeja</span><strong>{formatBRL(calculation.productionCost)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-base font-semibold text-brand"><span>Preço sugerido</span><strong>{formatBRL(targetPrice)}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Bandejas necessárias</span><strong>{calculation.traysNeeded}</strong></div>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Custo final</span><strong>{formatBRL(calculation.productionFinalCost)}</strong></div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Cadastrar produto</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Nome do produto</span>
                <input className="input-base" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex.: Miniatura de suporte" />
              </label>

              <label className="block text-sm text-slate-600 dark:text-slate-300">
                <span className="mb-1 block font-medium">Descrição</span>
                <textarea className="input-base min-h-[96px] resize-none" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Descreva o item produzido" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block font-medium">Categoria</span>
                  <input className="input-base" list="calculator-categories" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} placeholder="Escolha ou escreva uma categoria" />
                  <datalist id="calculator-categories">
                    {categories.map((category) => <option key={category.id} value={category.name} />)}
                  </datalist>
                </label>

                <label className="block text-sm text-slate-600 dark:text-slate-300">
                  <span className="mb-1 block font-medium">Estoque</span>
                  <input className="input-base" type="number" min={0} value={productStock} onChange={(e) => setProductStock(clamp(Number(e.target.value || 1), 0, 999999))} />
                </label>
              </div>

              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-slate-50/50 dark:bg-slate-900/20 p-3 text-sm text-slate-600 dark:text-slate-300">
                <label className="block font-medium text-slate-700 dark:text-slate-200" htmlFor="calculator-final-price">Preço final para cadastro (editável)</label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-500">R$</span>
                  <input id="calculator-final-price" className="input-base font-bold text-brand" type="number" min={0} step="0.01" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
                </div>
                <p className="text-xs mt-1">Sugestão atual: {formatBRL(targetPrice)} · Lucro selecionado: {selectedProfit}%</p>
              </div>

              <button type="button" onClick={createProduct} disabled={savingProduct} className="btn btn-primary w-full">
                {savingProduct ? 'Cadastrando...' : 'Cadastrar produto'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
