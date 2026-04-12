"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { mergeGuestCartToServer } from '@/lib/cart';
import { setCurrentUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await api.post("/auth/login", data, {
        _skipAuthRefresh: true,
        _skipAuthRedirect: true,
      });
      const user = res.data?.user;
      if (user) {
        setCurrentUser(user);
        toast.success("Login efetuado!");
        // tentar mesclar guest cart antes de redirecionar
        try {
          await mergeGuestCartToServer();
        } catch {
          // se falhar, continua normalmente
        }
        window.location.href = "/products";
      } else {
        const msg = "Sessão não iniciada.";
        setError(msg);
        toast.error(msg);
      }
    } catch (e: unknown) {
      let msg = "Erro ao logar";
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.message ?? e.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-brand">Login</h1>

        {error && (
          <p
            className="text-red-600 text-sm text-center"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              {...register("email")}
              className="input-base"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              {...register("password")}
              className="input-base"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Não tem conta?{" "}
          <a className="underline text-accent hover:text-brand" href="/register">
            Cadastre-se
          </a>
        </p>
      </div>
    </main>
  );
}
