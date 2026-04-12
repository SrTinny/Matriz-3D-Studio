// app/register/page.tsx
"use client";

import Image from 'next/image';
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { api } from "@/lib/api";
import { toast } from "sonner";
import logo from '../../assets/logo.png';
import Link from 'next/link';

/* ===================== Helpers ===================== */
const digits = (v: string) => (v || "").replace(/\D/g, "");

function isValidCPF(raw: string) {
  const cpf = digits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i], 10) * (10 - i);
  let d1 = 11 - (s % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;

  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i], 10) * (11 - i);
  let d2 = 11 - (s % 11);
  if (d2 >= 10) d2 = 0;

  return d2 === parseInt(cpf[10], 10);
}

/* ===================== Schema (Zod) ===================== */
const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("E-mail inválido"),
    // transforma para dígitos e valida CPF
    cpf: z
      .string()
      .transform(digits)
      .refine(isValidCPF, "CPF inválido"),
    // transforma para dígitos e valida tamanho (10 a 11)
    phone: z
      .string()
      .transform(digits)
      .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string().min(6, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Senhas não conferem",
  });

type FormData = z.infer<typeof schema>;

/* =============== Mock de CPF duplicado (apenas DEV) =============== */
function isCpfDuplicatedMock(cpfDigits: string) {
  const key = "cpfs_mock";
  const list: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
  return list.includes(cpfDigits);
}
function addCpfMock(cpfDigits: string) {
  const key = "cpfs_mock";
  const list: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
  if (!list.includes(cpfDigits)) {
    localStorage.setItem(key, JSON.stringify([...list, cpfDigits]));
  }
}

/* ===================== Página ===================== */
export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);

    // `data.cpf` e `data.phone` já vêm só com dígitos por causa do transform()
    const cpfDigits = data.cpf;
    const phoneDigits = data.phone;

    // Mock de CPF duplicado apenas em desenvolvimento
    if (process.env.NODE_ENV !== "production" && isCpfDuplicatedMock(cpfDigits)) {
      const msg = "CPF já cadastrado (simulado)";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        cpf: cpfDigits,
        phone: phoneDigits,
      });

      if (process.env.NODE_ENV !== "production") {
        addCpfMock(cpfDigits);
      }

      toast.success("Cadastro criado! Verifique o link de ativação no console do backend.");
      reset();
      window.location.href = "/login";
    } catch (e: unknown) {
      let msg = "Erro ao registrar";
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.message ?? e.message ?? msg;
        // Ex.: backend pode retornar 409 para duplicidade de e-mail/CPF
        // if (e.response?.status === 409) msg = "CPF ou e-mail já cadastrado";
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-4 md:items-center md:py-6">
      <div className="card w-full max-w-2xl p-4 space-y-3 md:p-5 md:space-y-4">
        <Link href="/" className="mx-auto flex w-full max-w-[200px] justify-center" aria-label="Ir para a página inicial">
          <Image
            src={logo}
            alt="Matriz 3D Studio"
            priority
            className="h-11 w-auto max-w-full object-contain md:h-13"
          />
        </Link>

        <header className="space-y-0 text-center">
          <h1 className="text-xl font-bold text-brand md:text-2xl">Cadastro</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 md:text-sm">
            Crie sua conta para continuar.
          </p>
        </header>

        {error && (
          <p
            className="text-red-600 text-sm text-center"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2 md:gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm">
              Nome
            </label>
            <input
              id="name"
              className="input-base"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-err" : undefined}
            />
            {errors.name && (
              <p id="name-err" className="text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-base"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
            />
            {errors.email && (
              <p id="email-err" className="text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cpf" className="mb-1 block text-sm">
              CPF
            </label>
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <IMaskInput
                  id="cpf"
                  mask="000.000.000-00"
                  value={field.value}
                  onAccept={(val) => field.onChange(val)}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  className="input-base"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={!!errors.cpf}
                  aria-describedby={errors.cpf ? "cpf-err" : undefined}
                />
              )}
            />
            {errors.cpf && (
              <p id="cpf-err" className="text-sm text-red-600">
                {errors.cpf.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm">
              Telefone
            </label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <IMaskInput
                  id="phone"
                  mask="(00) 00000-0000"
                  value={field.value}
                  onAccept={(val) => field.onChange(val)}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  className="input-base"
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-err" : undefined}
                />
              )}
            />
            {errors.phone && (
              <p id="phone-err" className="text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm">
              Senha
            </label>
            <input
              id="password"
              className="input-base"
              type="password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-err" : undefined}
              autoComplete="new-password"
            />
            {errors.password && (
              <p id="password-err" className="text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm">
              Confirmar senha
            </label>
            <input
              id="confirm"
              className="input-base"
              type="password"
              {...register("confirm")}
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? "confirm-err" : undefined}
              autoComplete="new-password"
            />
            {errors.confirm && (
              <p id="confirm-err" className="text-sm text-red-600">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-center">
            <button
              disabled={isSubmitting}
              className="btn btn-primary w-full max-w-[220px] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Cadastrar"}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-slate-600 dark:text-slate-300">
          Já tem conta?{" "}
          <a className="underline text-accent hover:text-brand" href="/login">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
