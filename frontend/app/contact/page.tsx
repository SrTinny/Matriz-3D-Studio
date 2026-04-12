"use client";

import { useState } from 'react';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    // Simular envio (não realiza network request)
    setTimeout(() => setStatus('sent'), 800);
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Contato</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">Fale conosco para suporte, orçamento ou parceria. Use o formulário ou um dos contatos abaixo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <section className="card p-6" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4">Formulário de Contato</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome *</label>
              <input required placeholder="Seu nome" className="input-base mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required placeholder="seu@email.com" className="input-base mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone (opcional)</label>
              <input placeholder="(11) 9XXXX-XXXX" className="input-base mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assunto *</label>
              <input required placeholder="Orçamento, suporte ou parceria" className="input-base mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mensagem *</label>
              <textarea required rows={6} placeholder="Descreva seu projeto ou dúvida..." className="input-base mt-1" />
            </div>

            <div className="flex items-center gap-4">
              <button disabled={status === 'sending'} className="bg-brand hover:bg-brand-600 transition text-white px-5 py-2 rounded-md shadow">
                {status === 'sending' ? 'Enviando...' : 'Enviar mensagem'}
              </button>
              {status === 'sent' && (
                <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded">Mensagem enviada — obrigado!</div>
              )}
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="card p-5 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3">Métodos alternativos</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/></svg>
                <div><strong>Email:</strong> suporte@matriz3dstudio.local</div>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92V21a1 1 0 01-1.11 1A19 19 0 013 5.11 1 1 0 014 4h4.09a1 1 0 01.95.68 12.34 12.34 0 00.7 2.81 1 1 0 01-.24 1L7.91 12.09a16 16 0 007.01 7.01l1.6-2.59a1 1 0 011-.24 12.34 12.34 0 002.81.7c.3.04.5.49.68.95H22z"/></svg>
                <div><strong>Telefone:</strong> (11) 4000-0000</div>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l9-4 9 4V5a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
                <div><strong>Endereço:</strong> Rua Exemplo, 123, Centro — Cidade Fictícia</div>
              </div>
            </div>
          </div>

          <div className="card p-5 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3">Suporte & FAQ</h3>
              <div className="space-y-2 text-sm text-gray-700">
              <details className="p-3 border rounded" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <summary className="font-medium">Como acompanho meu pedido?</summary>
                <p className="mt-2">Você recebe um email com o código de rastreio assim que o pedido é enviado.</p>
              </details>
              <details className="p-3 border rounded" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <summary className="font-medium">Qual o prazo de devolução?</summary>
                <p className="mt-2">Oferecemos 30 dias para troca ou devolução em produtos elegíveis.</p>
              </details>
              <details className="p-3 border rounded" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <summary className="font-medium">Posso alterar o endereço após o pedido?</summary>
                <p className="mt-2">Entre em contato rapidamente; tentaremos alterar antes do envio quando possível.</p>
              </details>
            </div>
          </div>

          <div className="card p-5 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3">Mapa (placeholder)</h3>
            <div className="h-48 rounded-md bg-white border flex items-center justify-center text-gray-700 dark:text-gray-200" style={{ borderColor: 'var(--color-border)' }}>
              <svg className="h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
