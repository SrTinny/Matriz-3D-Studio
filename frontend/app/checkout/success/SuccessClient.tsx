'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    imageUrl?: string | null;
  };
};

type Order = {
  id: string;
  total: number;
  paymentMethod: string;
  shippingLabel: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement?: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  items: OrderItem[];
  createdAt: string;
};

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const res = await api.get<Order>(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        toast.error('Erro ao carregar detalhes do pedido finalizado.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40dvh] gap-3">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Buscando resumo do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card p-6 text-center max-w-md mx-auto my-12 space-y-4">
        <div className="mx-auto w-12 h-12 text-red-500 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Pedido Não Encontrado</h2>
        <p className="text-sm text-slate-500">
          Não conseguimos encontrar os detalhes do seu pedido. Caso a cobrança tenha sido realizada, entre em contato com nosso suporte.
        </p>
        <Link href="/" className="btn btn-primary inline-block text-xs">
          Voltar para a Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 space-y-6">
      <div className="card p-6 md:p-8 text-center space-y-4 border-emerald-500/20 bg-emerald-500/[0.02]">
        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center animate-bounce shadow-md">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="space-y-1">
          <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Sucesso</span>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pedido Realizado com Sucesso!</h2>
          <p className="text-sm text-slate-500">Obrigado pela sua compra. Seu pedido foi processado.</p>
        </div>

        <div className="text-xs text-slate-500 font-mono bg-black/5 dark:bg-white/5 p-2.5 rounded-lg inline-block break-all">
          ID do Pedido: <span className="font-semibold">{order.id}</span>
        </div>
      </div>

      <div className="card p-5 space-y-5">
        <h3 className="text-lg font-bold border-b pb-3 border-[var(--color-border)]">Detalhes do Pedido</h3>

        {/* Resumo de itens */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Itens Comprados</p>
          <ul className="divide-y divide-[var(--color-border)]">
            {order.items.map((item) => (
              <li key={item.id} className="py-2.5 flex justify-between text-sm items-center">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.product.name}</p>
                  <p className="text-xs text-slate-500">Qtd: {item.quantity} · Preço unitário: {formatBRL(item.price)}</p>
                </div>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatBRL(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resumo de totais */}
        <div className="border-t pt-3 border-[var(--color-border)] space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Pagamento via</span>
            <span className="font-semibold text-slate-800 dark:text-white">{order.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 border-[var(--color-border)] font-bold text-base">
            <span>Total Pago</span>
            <span className="text-brand">{formatBRL(order.total)}</span>
          </div>
        </div>

        {/* Endereço de entrega */}
        <div className="border-t pt-3 border-[var(--color-border)] space-y-2 text-sm">
          <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Endereço de Entrega</p>
          <div className="text-slate-700 dark:text-slate-200">
            <p className="font-semibold">{order.shippingStreet}, {order.shippingNumber} {order.shippingComplement && `· ${order.shippingComplement}`}</p>
            <p>{order.shippingNeighborhood} — {order.shippingCity}/{order.shippingState}</p>
            <p className="text-xs text-slate-500">CEP: {order.shippingZipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="border-t pt-4 border-[var(--color-border)] grid gap-2 sm:grid-cols-2">
          <Link href="/" className="btn btn-primary w-full text-center">
            Voltar para a Loja
          </Link>
          <Link href="/account" className="btn btn-outline w-full text-center">
            Ver Meus Endereços / Minha Conta
          </Link>
        </div>
      </div>
    </div>
  );
}
