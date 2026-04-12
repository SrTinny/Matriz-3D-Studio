"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { logout, setCurrentUser } from "@/lib/auth";
import type { AuthUser, SelectedAddressSummary } from "@/lib/auth-store";

type Address = SelectedAddressSummary;

type AccountResponse = {
  user: AuthUser;
  addresses: Address[];
};

type AddressFormState = {
  label: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
};

const emptyForm: AddressFormState = {
  label: "",
  zipCode: "",
  state: "",
  city: "",
  neighborhood: "",
  street: "",
  number: "",
  complement: "",
};

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function formatAddressLine(address: { street: string; number: string; complement?: string | null }) {
  return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''}`;
}

function formatAddressMeta(address: Pick<AddressFormState, 'neighborhood' | 'city' | 'state' | 'zipCode'>) {
  return `${address.neighborhood} - ${address.city}/${address.state} - CEP ${formatZipCode(address.zipCode)}`;
}

export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAddressId, setBusyAddressId] = useState<string | null>(null);

  const selectedAddressId = user?.selectedAddress?.id ?? null;

  const orderedAddresses = useMemo(
    () =>
      [...addresses].sort((left, right) => {
        const leftSelected = left.id === selectedAddressId ? 1 : 0;
        const rightSelected = right.id === selectedAddressId ? 1 : 0;
        if (leftSelected !== rightSelected) return rightSelected - leftSelected;
        return left.label.localeCompare(right.label, 'pt-BR', { sensitivity: 'base' });
      }),
    [addresses, selectedAddressId],
  );

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function syncAccount(payload: AccountResponse) {
    setUser(payload.user);
    setAddresses(payload.addresses);
    setCurrentUser(payload.user);
  }

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<AccountResponse>('/auth/me', { _skipAuthRedirect: true });
      syncAccount(res.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        setAddresses([]);
        setCurrentUser(null);
        return;
      }

      let message = 'Nao foi possivel carregar sua conta.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? error.message ?? message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  function handleFieldChange(field: keyof AddressFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      zipCode: formatZipCode(address.zipCode),
      state: address.state,
      city: address.city,
      neighborhood: address.neighborhood,
      street: address.street,
      number: address.number,
      complement: address.complement ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        zipCode: form.zipCode.replace(/\D/g, ''),
        state: form.state.toUpperCase(),
      };

      const res = editingId
        ? await api.put<AccountResponse>(`/auth/addresses/${editingId}`, payload)
        : await api.post<AccountResponse>('/auth/addresses', payload);

      syncAccount(res.data);
      toast.success(editingId ? 'Endereco atualizado com sucesso.' : 'Endereco adicionado com sucesso.');
      resetForm();
    } catch (error: unknown) {
      let message = 'Nao foi possivel salvar o endereco.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? error.message ?? message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAddress(addressId: string) {
    try {
      setBusyAddressId(addressId);
      const res = await api.post<AccountResponse>(`/auth/addresses/${addressId}/select`);
      syncAccount(res.data);
      toast.success('Endereco selecionado para entrega.');
    } catch (error: unknown) {
      let message = 'Nao foi possivel selecionar o endereco.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? error.message ?? message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!window.confirm('Deseja remover este endereco?')) return;

    try {
      setBusyAddressId(addressId);
      const res = await api.delete<AccountResponse>(`/auth/addresses/${addressId}`);
      syncAccount(res.data);
      if (editingId === addressId) resetForm();
      toast.success('Endereco removido com sucesso.');
    } catch (error: unknown) {
      let message = 'Nao foi possivel remover o endereco.';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message ?? error.message ?? message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] animate-pulse">
          <div className="card h-72" />
          <div className="space-y-6">
            <div className="card h-72" />
            <div className="card h-80" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-screen-md items-center px-4 py-10">
        <section className="card w-full p-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Entre para gerenciar seus enderecos</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            A selecao do endereco de entrega agora aparece no header. Faça login para cadastrar e escolher o principal.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn btn-primary">Entrar</Link>
            <Link href="/register" className="btn btn-outline">Criar conta</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Minha conta</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Gerencie seus dados e escolha qual endereco deve aparecer no header como local padrao de entrega.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="card p-5">
            <div className="flex items-center gap-4 xl:flex-col xl:text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-[var(--color-text)]">{user.name}</p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-hover)]/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Endereco no header</p>
              {user.selectedAddress ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{user.selectedAddress.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{formatAddressLine(user.selectedAddress)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatAddressMeta(user.selectedAddress)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Nenhum endereco selecionado ainda.</p>
              )}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <button type="button" onClick={handleLogout} className="btn btn-outline w-full">Sair</button>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <section className="card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">Novo endereco</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Adicione um endereco e escolha qual deve virar o padrao exibido no header.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-outline self-start sm:self-auto">Cancelar edicao</button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="address-label" className="mb-1 block text-sm font-medium">Apelido</label>
                <input id="address-label" value={form.label} onChange={(event) => handleFieldChange('label', event.target.value)} className="input-base" placeholder="Casa, trabalho..." required />
              </div>
              <div>
                <label htmlFor="address-zip" className="mb-1 block text-sm font-medium">CEP</label>
                <input id="address-zip" value={form.zipCode} onChange={(event) => handleFieldChange('zipCode', formatZipCode(event.target.value))} className="input-base" placeholder="00000-000" required />
              </div>
              <div>
                <label htmlFor="address-state" className="mb-1 block text-sm font-medium">Estado</label>
                <input id="address-state" value={form.state} onChange={(event) => handleFieldChange('state', event.target.value.toUpperCase().slice(0, 2))} className="input-base" placeholder="SP" required />
              </div>
              <div>
                <label htmlFor="address-city" className="mb-1 block text-sm font-medium">Cidade</label>
                <input id="address-city" value={form.city} onChange={(event) => handleFieldChange('city', event.target.value)} className="input-base" placeholder="Sao Paulo" required />
              </div>
              <div>
                <label htmlFor="address-neighborhood" className="mb-1 block text-sm font-medium">Bairro</label>
                <input id="address-neighborhood" value={form.neighborhood} onChange={(event) => handleFieldChange('neighborhood', event.target.value)} className="input-base" placeholder="Centro" required />
              </div>
              <div>
                <label htmlFor="address-number" className="mb-1 block text-sm font-medium">Numero</label>
                <input id="address-number" value={form.number} onChange={(event) => handleFieldChange('number', event.target.value)} className="input-base" placeholder="123" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address-street" className="mb-1 block text-sm font-medium">Rua / Avenida</label>
                <input id="address-street" value={form.street} onChange={(event) => handleFieldChange('street', event.target.value)} className="input-base" placeholder="Rua Exemplo" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address-complement" className="mb-1 block text-sm font-medium">Complemento</label>
                <input id="address-complement" value={form.complement} onChange={(event) => handleFieldChange('complement', event.target.value)} className="input-base" placeholder="Apto, bloco, referencia..." />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
                  {saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Adicionar endereco'}
                </button>
                {!editingId && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    O primeiro endereco cadastrado vira o padrao automaticamente.
                  </p>
                )}
              </div>
            </form>
          </section>

          <section className="card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">Meus enderecos</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Selecione o endereco que deve aparecer ao lado da logo no header.</p>
              </div>
              <span className="badge self-start sm:self-auto">{addresses.length} cadastrado(s)</span>
            </div>

            {orderedAddresses.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-slate-600 dark:text-slate-300">
                Nenhum endereco cadastrado ainda.
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {orderedAddresses.map((address) => {
                  const isSelected = address.id === selectedAddressId;
                  const isBusy = busyAddressId === address.id;

                  return (
                    <li
                      key={address.id}
                      className={`rounded-2xl border p-4 transition-colors ${isSelected ? 'border-brand bg-brand/5' : 'border-[var(--color-border)] bg-[var(--color-card)]'}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--color-text)]">{address.label}</h3>
                            {isSelected && <span className="badge">Selecionado no header</span>}
                          </div>
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{formatAddressLine(address)}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatAddressMeta(address)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {!isSelected && (
                            <button type="button" onClick={() => void handleSelectAddress(address.id)} disabled={isBusy} className="btn btn-primary">
                              {isBusy ? 'Salvando...' : 'Selecionar'}
                            </button>
                          )}
                          <button type="button" onClick={() => startEdit(address)} className="btn btn-outline">Editar</button>
                          <button type="button" onClick={() => void handleDeleteAddress(address.id)} disabled={isBusy} className="btn btn-outline">
                            Excluir
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
