"use client";

import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Sobre a Matriz 3D Studio</h1>
        <p className="text-gray-600 mt-2">Conheça a proposta da loja, a equipe e o que orienta nossas coleções 3D.</p>
        <div className="mt-4">
          <Link href="/" className="text-sm text-brand hover:underline">Voltar para a loja</Link>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Nossa História e Missão</h2>
        <p className="text-gray-700 leading-relaxed">
          A Matriz 3D Studio nasce para organizar objetos 3D com clareza, intenção visual e suporte prático.
          Trabalhamos para que cada item seja fácil de encontrar, comparar e aplicar em cenas, projetos e coleções.
        </p>
        <p className="text-gray-700 leading-relaxed mt-3">
          Nossa missão é entregar valor real através de curadoria cuidadosa, atendimento responsável e
          interfaces que respeitam o tempo de quem está montando um portfólio, render ou biblioteca de ativos.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Equipe e Valores</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Nossa equipe é pequena, multidisciplinar e apaixonada por 3D. Valorizamos:
        </p>
        <ul className="list-disc pl-5 text-gray-700">
          <li><strong>Precisão:</strong> descrições e previews devem ajudar na decisão.</li>
          <li><strong>Estética:</strong> cada peça precisa fazer sentido visualmente.</li>
          <li><strong>Qualidade:</strong> priorizamos assets bem organizados e consistentes.</li>
          <li><strong>Suporte:</strong> cuidamos de dúvidas técnicas e de uso com atenção.</li>
        </ul>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Team card placeholders */}
          {['Mariana Silva — Direção', 'Pedro Costa — Produto 3D', 'Ana Ribeiro — Atendimento'].map((t) => (
            <div key={t} className="p-4 border rounded-md" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-36 bg-white/80 border rounded-md flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3" />
                  <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
              </div>
              <h3 className="mt-3 font-medium">{t}</h3>
              <p className="text-sm text-gray-600 mt-1">Responsável por decisões estratégicas e operação diária.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Elemento de Confiança</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          A confiança dos nossos clientes vem da combinação de atendimento humano, políticas claras e organização visual.
          Abaixo você encontra depoimentos fictícios e exemplos de compras atendidas com cuidado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => (
            <div key={i} className="p-4 border rounded-md" style={{ borderColor: 'var(--color-border)' }}>
              <div className="h-40 bg-white/80 border rounded-md flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="14" rx="2" />
                  <path d="M7 14l3-3 2 2 4-4 3 3" />
                </svg>
              </div>
              <p className="mt-3 text-gray-700">Excelente curadoria e materiais bem apresentados. Recomendo!</p>
              <p className="mt-2 text-sm text-gray-500">— Cliente Fictício #{i}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t text-center hidden md:block" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm text-gray-600">© {new Date().getFullYear()} Matriz 3D Studio — Loja fictícia criada para demonstração.</p>
      </footer>
    </main>
  );
}
