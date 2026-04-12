"use client";

import { useState, useRef, useEffect } from 'react';

type Message = { id: string; fromMe: boolean; text: string; time: string };

const sampleConvos = [
  { id: 'c1', name: 'Suporte Matriz 3D Studio', last: 'Como podemos ajudar?', unread: 2 },
  { id: 'c2', name: 'Orçamento - João', last: 'Tem interesse no modelo X?', unread: 0 },
  { id: 'c3', name: 'Projeto - Maria', last: 'Vamos revisar o briefing amanhã?', unread: 1 },
];

const sampleMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', fromMe: false, text: 'Olá, como podemos ajudar?', time: '09:10' },
    { id: 'm2', fromMe: true, text: 'Tenho uma dúvida sobre um pedido.', time: '09:12' },
  ],
  c2: [
    { id: 'm3', fromMe: false, text: 'Temos desconto hoje!', time: '12:00' },
  ],
  c3: [
    { id: 'm4', fromMe: false, text: 'Você vem ao meetup?', time: '20:21' },
  ],
};

export default function ChatPage() {
  const [convos] = useState(sampleConvos);
  const [active, setActive] = useState(convos[0].id);
  const [messages, setMessages] = useState<Message[]>(sampleMessages[convos[0].id] || []);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(sampleMessages[active] || []);
  }, [active]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const next: Message = { id: String(Date.now()), fromMe: true, text: text.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((s) => [...s, next]);
    setText('');
    // simular resposta
    setTyping(true);
    setTimeout(() => {
      setMessages((s) => [...s, { id: String(Date.now()+1), fromMe: false, text: 'Recebemos sua mensagem. Obrigado!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Mensagens</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="card p-2">
            <div className="px-3 py-2 font-medium">Conversas</div>
            <div className="space-y-2">
              {convos.map((c) => (
                <button key={c.id} onClick={() => setActive(c.id)} className={`w-full text-left p-3 flex items-center justify-between ${active===c.id? 'bg-[var(--color-hover)]':''}`}>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.last}</div>
                  </div>
                  {c.unread > 0 && <span className="badge">{c.unread}</span>}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="card flex flex-col h-[60vh]">
            <header className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{convos.find(c=>c.id===active)?.name}</div>
                  <div className="text-sm text-gray-600">Online</div>
                </div>
                <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-4 space-y-4" style={{ background: 'var(--color-bg)' }}>
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[70%] p-3 rounded ${m.fromMe ? 'ml-auto bg-brand text-white' : 'bg-[var(--color-card)] text-gray-800'}`}>
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs opacity-70 mt-1 text-right">{m.time}</div>
                </div>
              ))}
              {typing && <div className="text-sm text-gray-500">Digitando...</div>}
              <div ref={messagesEnd} />
            </div>

            <form onSubmit={send} className="p-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." className="input-base flex-1" />
              <button type="submit" className="btn btn-primary">Enviar</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
