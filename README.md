# Matriz 3D Studio

Monorepo fullstack de uma loja de objetos 3D com frontend em Next.js e backend em Express + Prisma/PostgreSQL.

## Stack
- Frontend: Next.js (App Router), React, TypeScript, TailwindCSS
- Backend: Express, TypeScript, Prisma
- Banco: PostgreSQL

## Estrutura
```text
.
├── frontend/
├── backend/
└── README.md
```

## Como rodar local
1. Backend

```powershell
cd backend
npm install
npm run dev
```

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Variáveis importantes
- Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
- Frontend: `NEXT_PUBLIC_API_URL`

## Usuário seed
- Admin: `admin@ux.com` / `admin123`

## Atualizações recentes (desde 9b0a2d4)
- Endurecimento de segurança no backend: validação obrigatória de env, cookies HttpOnly, refresh token rotativo e CSRF.
- Sessão do frontend migrada para cookies HttpOnly com hidratação por `GET /auth/me`.
- Home e fluxos de compra reformulados com foco em responsividade.
- Footer redesenhado em estilo marketplace.
- Endereços por cliente com endereço selecionado exibido no header.
- Menu de perfil estabilizado e remoção do acesso ao layout antigo de produtos.

## Execução local
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

Para detalhes de rotas e setup de cada app, veja [frontend/README.md](frontend/README.md) e [backend/README.md](backend/README.md).
