"use client";

import { useEffect, useMemo, useState } from 'react';

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string; // ISO
  unread: boolean;
  category: 'promo' | 'order' | 'system' | 'social';
};

const sample: Notification[] = [
  { id: 'n1', title: 'Pedido #234 enviado', body: 'Seu pedido #234 foi enviado e está a caminho. Código de rastreio: ABC123.', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), unread: true, category: 'order' },
  { id: 'n2', title: 'Promoção: Headset 20% off', body: 'Aproveite 20% de desconto em headsets até domingo.', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), unread: true, category: 'promo' },
  { id: 'n3', title: 'Bem-vindo à Matriz 3D Studio', body: 'Obrigado por se juntar a nós! Dica: salve seus favoritos para montar sua coleção.', time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), unread: false, category: 'system' },
  { id: 'n4', title: 'Comentário em produto', body: 'Maria comentou: "Ótima qualidade!" no Teclado Gamer.', time: new Date(Date.now() - 1000 * 60 * 20).toISOString(), unread: true, category: 'social' },
];

const STORAGE_KEY = 'matriz3dstudio:notifications:state';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Notification[];
    } catch {}
    return sample;
  });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selected, setSelected] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      // notify other components (header) that notifications changed
      try { window.dispatchEvent(new CustomEvent('notifications:changed')); } catch {}
    } catch {}
  }, [items]);

  const unreadCount = useMemo(() => items.filter((i) => i.unread).length, [items]);

  function toggleRead(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, unread: !it.unread } : it)));
  }

  function markAllRead() {
    setItems((prev) => prev.map((it) => ({ ...it, unread: false })));
  }

  function clearAll() {
    setItems([]);
    setSelected(null);
  }

  const visible = useMemo(() => {
    return items.filter((i) => (filter === 'unread' ? i.unread : true)).sort((a, b) => Number(new Date(b.time)) - Number(new Date(a.time)));
  }, [items, filter]);

  const selectedItem = items.find((i) => i.id === selected) ?? visible[0] ?? null;

  useEffect(() => {
    if (!selected && visible.length > 0) setSelected(visible[0].id);
  }, [visible, selected]);

  return (
    <main className="layout-container py-8">
      <h1 className="text-2xl font-semibold mb-4">Notificações</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Mostrando</div>
          <div className="inline-flex rounded-md bg-[var(--color-card)] p-1" style={{ border: '1px solid var(--color-border)' }}>
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-brand/10 text-brand' : 'text-gray-700 dark:text-gray-300'}`}>Todas</button>
            <button onClick={() => setFilter('unread')} className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-brand/10 text-brand' : 'text-gray-700 dark:text-gray-300'}`}>Não lidas</button>
          </div>
          <div className="ml-3 text-sm text-gray-500">• {unreadCount} não lidas</div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="btn btn-outline">Marcar todas como lidas</button>
          <button onClick={clearAll} className="btn">Limpar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="card p-2">
            <div className="px-3 py-2 font-medium">Lista</div>
            <div className="space-y-1">
              {visible.length === 0 && <div className="p-4 text-sm text-gray-500">Nenhuma notificação</div>}
              {visible.map((n) => (
                <button key={n.id} onClick={() => setSelected(n.id)} className={`w-full text-left p-3 flex items-start gap-3 ${selected === n.id ? 'bg-[var(--color-hover)]' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${n.unread ? 'bg-brand text-white' : 'bg-slate-200 dark:bg-slate-800 text-gray-600'}`}>
                      {n.category === 'order' ? 'O' : n.category === 'promo' ? '%' : n.category === 'system' ? 'S' : 'M'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-gray-500">{new Date(n.time).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{n.body}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }} className="text-xs text-gray-600 hover:underline">{n.unread ? 'Marcar como lida' : 'Marcar não lida'}</button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="card p-4">
            {!selectedItem ? (
              <div className="p-8 text-center text-gray-500">Selecione uma notificação para ver os detalhes.</div>
            ) : (
              <article>
                <header className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedItem.title}</h2>
                    <div className="text-sm text-gray-500 mt-1">{new Date(selectedItem.time).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRead(selectedItem.id)} className="btn btn-outline text-sm">{selectedItem.unread ? 'Marcar lida' : 'Marcar não lida'}</button>
                  </div>
                </header>

                <div className="mt-4 text-sm text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.body}</div>

                <div className="mt-6">
                  <div className="text-sm text-gray-500">Ações rápidas</div>
                  <div className="mt-2 flex gap-2">
                    <button className="btn">Ver pedido</button>
                    <button className="btn btn-outline">Snooze</button>
                    <button onClick={() => { setItems((prev) => prev.filter((it) => it.id !== selectedItem.id)); setSelected(null); }} className="btn">Remover</button>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
