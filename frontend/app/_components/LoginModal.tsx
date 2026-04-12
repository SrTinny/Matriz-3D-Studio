"use client";

import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onContinueGuest: () => void;
};

export default function LoginModal({ open, onClose, onLogin, onContinueGuest }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg p-6 w-full max-w-md" style={{ background: 'var(--color-card)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-lg font-semibold mb-2">Atenção</h3>
        <p className="text-sm mb-4">Você precisa fazer login para salvar o carrinho no servidor. Deseja fazer login agora?</p>

        <div className="flex gap-2 justify-end">
          <button onClick={onContinueGuest} className="btn">
            Continuar como convidado
          </button>
          <button onClick={onLogin} className="btn btn-primary">
            Fazer login
          </button>
        </div>
        <button aria-label="Fechar" onClick={onClose} className="mt-4 text-sm text-slate-500">Cancelar</button>
      </div>
    </div>
  );
}
