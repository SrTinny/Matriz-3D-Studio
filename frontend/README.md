# Frontend - Matriz 3D Studio

Aplicação cliente em Next.js (App Router) consumindo a API do backend.

## Stack
- Next.js, React, TypeScript, TailwindCSS
- Axios, React Hook Form, Zod, Sonner

## Rotas principais
- `/`: home principal (vitrine estilo marketplace)
- `/products`: redireciona para `/`
- `/products/[slug]`: detalhe do produto
- `/account`: gestão da conta e dos endereços
- `/cart`, `/login`, `/register`, `/admin/products`

## Sessão e autenticação
- Sessão baseada em cookies HttpOnly (sem token salvo em `localStorage`).
- Hidratação do usuário atual via `GET /auth/me`.
- Refresh automático de sessão no interceptor do Axios.
- Envio automático de `X-CSRF-Token` para métodos não idempotentes.

## Header e navegação
- Header exibe o endereço selecionado do usuário.
- Dropdown de perfil com comportamento estável para mouse/teclado.
- Navegação sem atalho para layout legado de produtos.

## Como rodar
```powershell
cd frontend
npm install
npm run dev
```

Build de produção:

```powershell
npm run build
```

## Variável importante
- `NEXT_PUBLIC_API_URL`

## Execução local
- Frontend: `http://localhost:3001`
- API: `http://localhost:3000`
