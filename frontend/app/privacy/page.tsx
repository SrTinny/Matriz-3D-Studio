"use client";

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-gray-600 mt-2">Entenda quais dados coletamos, como os usamos e os seus direitos.</p>
        <div className="mt-4">
          <Link href="/" className="text-sm text-brand hover:underline">Voltar para a loja</Link>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Quais informações são coletadas</h2>
        <p className="text-gray-700 leading-relaxed">
          Coletamos dois tipos principais de informações:
        </p>
        <ul className="list-disc pl-5 text-gray-700 mt-3">
          <li><strong>Dados pessoais:</strong> nome, email, endereço de entrega e informações de pagamento quando você cria uma conta ou realiza um pedido.</li>
          <li><strong>Dados de navegação anônimos:</strong> informações técnicas sobre como você usa o site (páginas visitadas, tempo na página, dispositivo), coletadas de forma agregada para melhorar a experiência.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Como e por que usamos essas informações</h2>
        <p className="text-gray-700 leading-relaxed">
          Utilizamos os dados para algumas finalidades principais:
        </p>
        <ul className="list-disc pl-5 text-gray-700 mt-3">
          <li><strong>Processamento de pedidos:</strong> usamos seus dados para confirmar e enviar compras, emitir notas fiscais e prestar suporte.</li>
          <li><strong>Análise do site:</strong> os dados de navegação agregados ajudam a entender quais áreas precisam de melhoria e quais produtos têm maior interesse.</li>
          <li><strong>Cookies:</strong> utilizamos cookies essenciais para manter a sessão e cookies opcionais para personalização e análise. Você pode controlar cookies via configurações do navegador.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Seus direitos sobre os dados</h2>
        <p className="text-gray-700 leading-relaxed">
          Você tem direitos sobre os seus dados e nós nos comprometemos a respeitá-los. Exemplos de direitos:
        </p>
        <ul className="list-disc pl-5 text-gray-700 mt-3">
          <li><strong>Ver:</strong> solicitar uma cópia dos dados que mantemos sobre você.</li>
          <li><strong>Corrigir:</strong> atualizar informações incorretas ou desatualizadas.</li>
          <li><strong>Apagar:</strong> pedir a exclusão dos seus dados, salvo quando houver obrigação legal de manutenção.</li>
        </ul>
        <p className="text-gray-700 mt-3">Para exercer qualquer um desses direitos, entre em contato conosco pelo email <strong>privacidade@matriz3dstudio.local</strong> e responderemos em até 30 dias úteis.</p>
      </section>
    </main>
  );
}
