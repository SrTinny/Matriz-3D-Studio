'use client';

import React, { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <main className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[40dvh] gap-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Carregando detalhes do pedido...</p>
        </div>
      }>
        <SuccessClient />
      </Suspense>
    </main>
  );
}
