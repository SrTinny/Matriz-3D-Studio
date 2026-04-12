## Instruções rápidas para agentes AI — UX Software

Objetivo: ser produtivo rápido neste monorepo fullstack (Next.js frontend + Express/Prisma backend).

Principais pontos (leia antes de editar código)
- Arquitetura: duas aplicações isoladas:
  - `frontend/` — Next.js (App Router). componente client-server split. Código de cliente usa `frontend/lib/api.ts` para comunicação com a API.
  - `backend/` — Express + TypeScript + Prisma. `src/index.ts` configura CORS, rotas e middleware de erro.
- Banco: Prisma + PostgreSQL. Schema em `backend/prisma/schema.prisma`. `prisma/Cart.userId` é `@unique` (um carrinho por usuário). `Product.slug` é `@unique` (usado para upserts/skipDuplicates).

Autenticação & autorização
- JWT via header: `Authorization: Bearer <token>`; ver `backend/src/middlewares/auth.ts` (tipos JwtUser, `authMiddleware`, `adminGuard`).
- Roles: `USER` e `ADMIN`. Guardas de rota seguem esses valores.
- Fluxo de registro: rota `POST /auth/register` cria `activationToken` e imprime link de ativação no console: `GET /auth/activate/:token`.

Integração frontend↔backend
- Frontend configura baseURL pela env `NEXT_PUBLIC_API_URL` (ver `frontend/package.json` scripts). `frontend/lib/api.ts`:
  - adiciona header Authorization com token salvo em `localStorage` sob a chave `token`.
  - trata 401 limpando token e redirecionando para `/login`.
  - retry simples: 3 tentativas com backoff (erros de rede, 5xx, 429).
- Token helpers em `frontend/lib/auth.ts` (decodifica exp e limpa token expirado).

CORS e deploys
- Backend permite origens locais e Vercel previews. Regra principal em `backend/src/index.ts`: lista `staticAllowed` + regex `vercelPreviewRe` + suporte a `process.env.FRONTEND_URL`.

Scripts e comandos úteis
- Backend (root `backend/package.json`):
  - dev: `npm run dev` (usa `ts-node-dev` — não precisa build para dev)
  - build: `npm run build` → `tsc`; start: `npm start` (executa `dist/index.js`)
  - prisma: `npx prisma migrate dev`, `npx prisma generate`, `npx prisma db seed` (seed configurado: `ts-node prisma/seed.ts`).
- Frontend (root `frontend/package.json`):
  - dev: `npm run dev` (Next.js `next dev -p 3001`)
  - build/start: `next build` / `next start -p 3001`.

Padrões de implementação a observar
- Prisma client: `backend/src/config/prisma.ts` usa cache global para evitar múltiplas instâncias em dev.
- Respostas e status codes padronizados: 400 (Zod), 401 (auth), 403 (forbidden), 404, 409 (conflict), 500. Ver `middlewares/errorHandler.ts` e READMEs.
- Produtos: `slug` é chave para evitar duplicatas; se for necessário upsert, usar `slug` como identificador.
- Carrinho: existe uma tabela `Cart` relacionada a `User` com `userId @unique` — não crie múltiplos carts por usuário.

Onde procurar quando precisar de contexto
- Rotas e controllers backend: `backend/src/modules/*` (auth, products, cart).
- Validações: arquivos `*.schemas.ts` ao lado das rotas (Zod).
- Configurações e envs: `backend/.env` (DATABASE_URL, JWT_SECRET, FRONTEND_URL), `frontend/.env.local` (NEXT_PUBLIC_API_URL).
- Prisma schema & migrations: `backend/prisma/schema.prisma` e `backend/prisma/migrations/`.

Pequenos exemplos rápidos
- Adicionar Authorization em chamadas Axios (comportamento já implementado): ver `frontend/lib/api.ts` — use `api.get('/products')` e o interceptor cuida do token.
- Rodar DB + aplicar migrations + seed (dev local):
  - `cd backend` 
  - `npx prisma migrate dev --name init`
  - `npx prisma generate`
  - `npx prisma db seed`

Boas práticas específicas deste repo
- Não altere diretamente `Cart.userId` para não quebrar a invariant de um carrinho por usuário.
- Para mudanças no modelo Product que dependem de unicidade, preserve a constraint `slug @unique` ou planeje uma migration cuidadosa.
- Quando ajustar CORS, mantenha a regex de preview do Vercel para evitar bloqueio de previews automatizados.

Notas finais
- Seja conservador com mudanças de API pública (endpoints em `backend/src/modules/*`) — o frontend assume contratos (payloads, nomes de campos, códigos de status).
- Se adicionar scripts npm, atualize os READMEs em `frontend/README.md` e `backend/README.md`.

Se alguma parte estiver incompleta ou quiser que eu inclua exemplos mais detalhados (p.ex. request/response reais, trechos de código), diga quais arquivos ou endpoints devo focar.

### Exemplos rápidos de request/response (úteis para agentes)

- Registrar usuário (public):

  POST /auth/register
  Request JSON:
  {
    "name": "João",
    "email": "joao@example.com",
    "password": "123456"
  }

  Response 201 (body):
  {
    "message": "Usuário registrado. Verifique o link de ativação no console.",
    "user": { "id": "<uuid>", "name": "João", "email": "joao@example.com", "role": "USER", "isActive": false }
  }

- Login (public):

  POST /auth/login
  Request JSON:
  { "email": "joao@example.com", "password": "123456" }

  Response 200 (body):
  { "message": "Login realizado com sucesso", "token": "<jwt>" }

- Buscar produtos (public):

  GET /products?page=1&perPage=10&search=teclado

  Response 200 (body):
  {
    "items": [ { "id": "<uuid>", "name": "Teclado", "slug": "teclado-gamer", "price": 199.9, "stock": 12 } ],
    "page": 1,
    "perPage": 10,
    "total": 42
  }

- Criar produto (ADMIN):

  POST /products  (Authorization: Bearer <token> com role=ADMIN)
  Request JSON:
  {
    "name": "Headset Gamer",
    "slug": "headset-gamer",
    "description": "7.1 Surround",
    "price": 399.9,
    "stock": 12
  }

  Response 201 (body):
  { "id": "<uuid>", "name": "Headset Gamer", "slug": "headset-gamer", "price": 399.9 }

## Checklist antes de PR
Sempre rode estes passos localmente antes de abrir um pull request. São ações rápidas que evitam regressões comuns neste repositório.

1. Rodar lint no backend e frontend

  Backend:

  ```powershell
  cd backend; npm run lint
  ```

  Frontend:

  ```powershell
  cd frontend; npm run lint
  ```

2. Rodar build (verifica erros de compilação/typing)

  Backend (TypeScript):

  ```powershell
  cd backend; npm run build
  ```

  Frontend (Next.js):

  ```powershell
  cd frontend; npm run build
  ```

3. Atualizar/gerar Prisma Client e testar migrations localmente

  ```powershell
  cd backend
  npx prisma generate
  npx prisma migrate dev --name <sua-mudanca>
  npx prisma db seed
  ```

  Observação: se a mudança altera constraints únicas (ex.: `Product.slug` ou `Cart.userId`), documente a estratégia de migração e valide duplicatas antes de aplicar a migration em produção.

4. Testes manuais rápidos (smoke)

  - Validar endpoint de health: `GET /` (ver `backend/src/index.ts`)
  - Registrar + ativar usuário (veja exemplo em Auth acima)
  - Criar/editar produto com role=ADMIN (use token do admin do seed)

5. Atualizar README(s) e este arquivo se necessário

  - Se adicionar/alterar scripts npm, adicione instruções em `backend/README.md` e/ou `frontend/README.md`.

6. Verificar CORS e variáveis de ambiente

  - Se a mudança introduz uma nova origem front (ou altera o domínio), atualize `backend/src/index.ts` (ou configure `FRONTEND_URL` em `.env`).

7. Commit claro e PR descritivo

  - Commit message curto + body explicando a motivação e os passos de validação locais.
  - Incluir lista rápida no PR: comandos que você rodou do checklist acima.

