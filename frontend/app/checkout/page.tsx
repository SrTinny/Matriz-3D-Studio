'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { api } from '@/lib/api';
import { hydrateSession } from '@/lib/auth';
import { toast } from 'sonner';

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
};

type Cart = {
  id: string;
  items: CartItem[];
};

type Address = {
  id: string;
  label: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string | null;
};

type UserResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    selectedAddress?: Address | null;
  };
};

export default function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [userName, setUserName] = useState('Cliente');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  
  // Dados do cartão simulados
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const userSession = await hydrateSession();
        if (!mounted) return;

        if (!userSession) {
          window.location.href = '/login';
          return;
        }

        // Carregar carrinho e dados do usuário detalhados
        const [cartRes, meRes] = await Promise.all([
          api.get<Cart>('/cart'),
          api.get<UserResponse>('/auth/me'),
        ]);

        if (!mounted) return;

        setCart(cartRes.data);
        setAddress(meRes.data.user.selectedAddress ?? null);
        setUserName(meRes.data.user.name || 'Cliente');

        if (cartRes.data.items.length === 0) {
          toast.error('Seu carrinho está vazio.');
          window.location.href = '/cart';
          return;
        }

        setReady(true);
      } catch (err) {
        toast.error('Erro ao carregar dados do checkout.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  }, [cart]);

  const totalQty = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  async function handleConfirmPurchase() {
    if (!address || !cart) {
      toast.error('Selecione um endereço de entrega antes de finalizar.');
      return;
    }

    try {
      setSubmitting(true);

      const itemsText = cart.items
        .map((item) => {
          const itemTotal = item.product.price * item.quantity;
          return `- ${item.product.name} (${item.quantity}x ${formatBRL(item.product.price)} = ${formatBRL(itemTotal)})`;
        })
        .join('\n');

      const addressText = `${address.street}, ${address.number}${address.complement ? ` · ${address.complement}` : ''} - ${address.neighborhood} / ${address.city}-${address.state} (CEP ${address.zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')})`;

      const whatsappMessage = [
        'Olá! Gostaria de finalizar meu pedido.',
        '',
        `Nome: ${userName}`,
        `Endereço: ${addressText}`,
        '',
        'Itens:',
        itemsText,
        '',
        `Total: ${formatBRL(total)}`,
      ].join('\n');

      const whatsappUrl = `https://wa.me/558896102643?text=${encodeURIComponent(whatsappMessage)}`;
      window.location.href = whatsappUrl;
    } catch (e: unknown) {
      let msg = 'Erro ao finalizar pedido';
      if (axios.isAxiosError(e)) {
        msg = (e.response?.data as { message?: string })?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !ready) {
    return (
      <main className="container mx-auto max-w-screen-xl px-4 py-8 flex items-center justify-center min-h-[50dvh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Carregando detalhes da compra...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="pb-4 border-b border-[var(--color-border)]">
        <h1 className="text-2xl font-bold text-brand sm:text-3xl">Finalizar Compra</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Revise seus dados, selecione o método de pagamento e conclua o seu pedido.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
        {/* Lado Esquerdo: Endereço & Pagamento */}
        <div className="space-y-6">
          {/* Sessão Endereço */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[var(--color-border)]">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Endereço de Entrega
              </h2>
              {address && (
                <Link href="/account" className="text-xs font-semibold text-brand hover:underline">
                  Alterar endereço
                </Link>
              )}
            </div>

            {address ? (
              <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <span className="badge mb-2">{address.label}</span>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {address.street}, {address.number} {address.complement && `· ${address.complement}`}
                </p>
                <p>{address.neighborhood} — {address.city}/{address.state}</p>
                <p className="text-xs text-slate-500">CEP: {address.zipCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-200 space-y-3">
                <p className="text-sm">
                  Nenhum endereço de entrega selecionado. É necessário cadastrar e selecionar um endereço na sua conta para finalizar a compra.
                </p>
                <Link href="/account" className="btn btn-accent inline-block text-center w-full sm:w-auto text-xs py-1.5 px-3">
                  Configurar Endereço
                </Link>
              </div>
            )}
          </section>

          {/* Sessão Pagamento */}
          <section className="card p-5 space-y-4" style={{ display: 'none' }} aria-hidden="true">
            <h2 className="text-lg font-semibold border-b pb-3 border-[var(--color-border)] flex items-center gap-2">
              <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Método de Pagamento (Simulado)
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('PIX')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'PIX'
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)]'
                }`}
              >
                <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-sm font-semibold">PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover)]'
                }`}
              >
                <svg className="w-8 h-8 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span className="text-sm font-semibold">Cartão de Crédito</span>
              </button>
            </div>
          </section>
        </div>

        {/* Lado Direito: Resumo do Pedido */}
        <div className="space-y-6">
          <section className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-3 border-[var(--color-border)]">
              Resumo do Pedido
            </h2>

            {cart && (
              <ul className="divide-y divide-[var(--color-border)] max-h-60 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <li key={item.id} className="py-3 flex gap-3 text-sm items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Qtd: {item.quantity} · Unidade: {formatBRL(item.product.price)}</p>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-white shrink-0">
                      {formatBRL(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t pt-3 border-[var(--color-border)] space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Frete</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Grátis (Digital/Produção)</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3 font-semibold text-base border-[var(--color-border)]">
                <span>Total</span>
                <span className="text-brand text-lg">{formatBRL(total)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmPurchase}
              disabled={submitting || !address}
              className="btn btn-primary w-full py-3 text-base mt-2 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Compra'
              )}
            </button>

            <Link href="/cart" className="btn btn-outline w-full text-xs">
              Voltar ao Carrinho
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
