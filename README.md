# Vidric

Multi-tenant SaaS for gallery phone shops (screen protectors, cases, accessories and application services). Each store has isolated users and data; a Super Admin manages which stores exist and can suspend/reactivate them.

**Status:** Phase 5a — stock frontend (`/estoque` list with KPIs/search/filters/CSV, product create + detail with movement modals and audit history, dead-stock report) on top of Phase 4 (liquid-glass login + PDV), Phase 3c (Finance/accrual + contas a pagar + caixa), Phase 3b (POS API), Phase 3a (catalog + stock API) and the Phase 2 Super Admin panel. Next: 5b Financeiro → 5c Caixa → 5d Contas a Pagar → 5e SuperAdmin → 6 Deploy.

## Stack

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core 8 + SQLite (swappable to PostgreSQL later)
- JWT Bearer authentication (8h expiry), BCrypt password hashing
- Multi-tenancy: single database, `LojaId` column + EF Core global query filter
- Roles: `SuperAdmin`, `AdminLoja`, `Funcionario`
- Swagger with JWT "Authorize" button
- Frontend: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui, TanStack Query, Axios, Framer Motion, sonner
- Frontend tests: Playwright (Chromium) at 1440px and 375px

## Solution layout

```
LojaGaleria.sln
└── src/
    ├── LojaGaleria.Domain/         entities, enums, ITenantProvider, stock + cash rules
    ├── LojaGaleria.Infrastructure/ AppDbContext, migrations, sale + caixa + contas + financeiro services
    └── LojaGaleria.API/            controllers, auth, middleware
└── tests/
    └── LojaGaleria.Tests/          xUnit (stock rules, sales concurrency/payments, finance accrual/cash, tenant isolation)
└── frontend/
    ├── src/app/                    (auth)/login, (app)/pdv, (app)/estoque (list/novo/detalhe/relatórios), (app)/admin, layout + globals.css
    ├── src/components/             layout (sidebar/header/caixa banner), pdv (busca/carrinho/pagamento), estoque (badges/menu/movimento/editar), ui (shadcn)
    ├── src/lib/                    axios client + interceptors, session/JWT, PDV cart rules, format, motion
    ├── e2e/                        Playwright checklist (login, layout, PDV, backend rules, viewports)
    └── theme-playground/ (repo root) design source of truth for the CSS tokens
```

## Running locally

Prerequisites: [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0).

```bash
# 1. Configure the JWT signing key (kept out of source control)
cd src/LojaGaleria.API
dotnet user-secrets set "Jwt:Key" "$(openssl rand -hex 32)"
# Windows PowerShell alternative:
#   dotnet user-secrets set "Jwt:Key" (-join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_}))

# 2. Run (migrations and the default SuperAdmin seed are applied at startup)
dotnet run --urls http://localhost:5080
```

Open Swagger at `http://localhost:5080/swagger`.

In production, provide the key via the `Jwt__Key` environment variable instead of user-secrets.

### Default SuperAdmin (development seed)

- Email: `admin@lojagaleria.com`
- Password: `Admin@123` — **change this before any real deployment.**

The SuperAdmin token has no `loja_id` claim and bypasses tenant filters. Store users always carry a `loja_id` claim and only see their own store's data.

## Running the frontend

Prerequisites: [Node.js 20+](https://nodejs.org). Start the API on `http://localhost:5080` first (see above).

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:5080`; set it to point the app at another API. The API allows this origin through the `Frontend` CORS policy.

Create a store to log into (the seeded SuperAdmin does not have a PDV):

```bash
curl -X POST http://localhost:5080/api/auth/registrar-loja \
  -H 'Content-Type: application/json' \
  -d '{"nomeLoja":"Galeria Vidric","nomeAdmin":"Ana Souza","emailAdmin":"demo@vidric.app","senhaAdmin":"Demo@123"}'
```

Validation suite (needs the API running; it seeds, sells and suspends real data on the demo store):

```bash
cd frontend
npx playwright test                        # 47 checks: login, layout, PDV, stock screens, dead-stock report, tenant isolation, 1440px + 375px
npx playwright show-report playwright-report
```

Screenshots land in `frontend/screenshots/` (gitignored, same policy as `theme-playground/screenshots/`).

### Before each demo

The app defaults to dark mode and the login card shows the demo credentials. The suite and demos sell real stock, so restock the demo store first:

```bash
cd frontend
node scripts/reset-demo.mjs   # restocks every product with qtdEstoque < 5 (+20, EntradaCompra "Reset demo")
```

**Frontend rules that mirror the backend:**

- Session lives in `localStorage` under `vidric.session`; the Axios request interceptor attaches the bearer token, the response interceptor sends an expired session (401) or a suspended store (403) back to `/login` with the reason.
- Cash sales are only offered when a caixa is open: the yellow "Caixa fechado" banner reads `GET /api/caixa/atual` (404 = closed) and a 400 from the API surfaces the backend message verbatim.
- Selling the last unit in two tabs is expected to produce one 201 and one 409; the 409 toast tells the operator to refresh the search.
- Picking "+ Película c/ Aplicação" always adds two cart lines — the protector (deducts stock) and the R$ 10,00 application service (does not).
- Partial payment is allowed and stays as `Parcial` (fiado); the CPF field is optional but must be complete when started.
- Visual language comes from `theme-playground/index.html`: the CSS variables are copied verbatim into `frontend/src/app/globals.css`, Vidric green `#2E7D32` is the identity, and the breakpoints (768px / 1024px) match the playground.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/registrar-loja` | public | Register a store + its first admin (201, 409 on duplicate email) |
| POST | `/api/auth/login` | public | Login; 403 if the store is suspended |
| GET | `/api/lojas/minha-loja` | AdminLoja/Funcionario | Current user's store (from JWT claim, never a parameter) |
| GET | `/api/admin/lojas` | SuperAdmin | List stores (paginated, user counts) |
| GET | `/api/admin/lojas/{id}` | SuperAdmin | Store detail + users (never password hashes) |
| PATCH | `/api/admin/lojas/{id}/suspender` | SuperAdmin | Suspend store (optional reason) |
| PATCH | `/api/admin/lojas/{id}/reativar` | SuperAdmin | Reactivate store |
| POST | `/api/admin/lojas/{id}/usuarios` | SuperAdmin | Add AdminLoja/Funcionario to a store |
| DELETE | `/api/admin/lojas/{id}/usuarios/{usuarioId}` | SuperAdmin | Soft-deactivate user (guards: self, last active admin) |
| GET | `/api/admin/dashboard` | SuperAdmin | Global aggregates |
| POST | `/api/produtos` | AdminLoja/Funcionario | Quick product create; initial stock becomes an `EntradaCompra` movement |
| GET | `/api/produtos` | AdminLoja/Funcionario | Search/filter/paginate (name, model, color, barcode, category) |
| GET | `/api/produtos/{id}` | AdminLoja/Funcionario | Product + last 20 stock movements |
| PUT | `/api/produtos/{id}` | AdminLoja/Funcionario | Update catalog data only (never stock quantity) |
| POST | `/api/produtos/{id}/movimentos` | AdminLoja/Funcionario | Stock movement; `SaidaVenda` is created only by the POS |
| PATCH | `/api/produtos/{id}/ativo` | AdminLoja/Funcionario | Toggle product active (soft delete) |
| GET | `/api/produtos/alertas/abaixo-minimo` | AdminLoja/Funcionario | Active products at/below minimum stock |
| GET | `/api/produtos/relatorios/parados?dias=30` | AdminLoja/Funcionario | Dead-stock report: stocked items with no `SaidaVenda` in the window (`vendasIndisponiveis: false`) |
| GET | `/api/produtos/exportar.csv` | AdminLoja/Funcionario | Export stock as CSV |
| GET | `/api/estoque/dashboard` | AdminLoja/Funcionario | Store stock aggregates + per-category values |
| POST | `/api/vendas` | AdminLoja/Funcionario | Create a sale (PDV): items + payments, atomic stock deduction, 409 on stock conflict |
| GET | `/api/vendas` | AdminLoja/Funcionario | List sales (status, CPF, date filters, paginated); `saldo` calculated |
| GET | `/api/vendas/a-receber` | AdminLoja/Funcionario | Receivables: `Parcial`/`Pendente` sales, oldest first (replaces the fiado notebook) |
| GET | `/api/vendas/{id}` | AdminLoja/Funcionario | Sale detail: items + payments + saldo |
| POST | `/api/vendas/{id}/pagamentos` | AdminLoja/Funcionario | Receive a payment on an existing sale (pay off fiado); rejects overpayment; cash payment needs an open caixa (400) |
| GET | `/api/financeiro/dashboard?dataInicio&dataFim` | AdminLoja/Funcionario | Accrual vs cash: `vendido`, `recebido`, accumulated `emAberto`, breakdown by payment form, `ticketMedio`, contas-a-pagar summary. Defaults to the current month |
| GET | `/api/financeiro/vendas-por-dia` | AdminLoja/Funcionario | Per-day `vendido`/`recebido`/`qtdVendas` series for the period |
| GET | `/api/financeiro/fluxo-caixa` | AdminLoja/Funcionario | Signed cash movements in the period (inflows `+`, outflows `−`) |
| POST | `/api/contas-pagar` | AdminLoja/Funcionario | Create a payable (description + amount + due date) |
| GET | `/api/contas-pagar?pago&vencidas&categoria` | AdminLoja/Funcionario | List payables (unpaid + overdue first, paginated) |
| PUT | `/api/contas-pagar/{id}` | AdminLoja/Funcionario | Edit a payable (never flips it to paid) |
| POST | `/api/contas-pagar/{id}/pagar` | AdminLoja/Funcionario | Settle a payable; `Dinheiro` routes through the open caixa as a `PagamentoConta` outflow, other forms leave caixa untouched |
| DELETE | `/api/contas-pagar/{id}` | AdminLoja/Funcionario | Delete a payable (409 if already paid) |
| POST | `/api/caixa/abrir` | AdminLoja/Funcionario | Open the store's cash register (409 if one is already open) |
| GET | `/api/caixa/atual` | AdminLoja/Funcionario | Current open caixa with computed entries/exits/balance (404 if none) |
| GET | `/api/caixa` | AdminLoja/Funcionario | Caixa history (paginated) |
| GET | `/api/caixa/{id}` | AdminLoja/Funcionario | Caixa detail + movements |
| POST | `/api/caixa/{id}/sangria` | AdminLoja/Funcionario | Cash withdrawal (outflow); 409 if the caixa is closed |
| POST | `/api/caixa/{id}/suprimento` | AdminLoja/Funcionario | Cash top-up (inflow); 409 if the caixa is closed |
| POST | `/api/caixa/{id}/fechar` | AdminLoja/Funcionario | Close the caixa; `calculado = Σentradas − Σsaídas`, `diferenca = informado − calculado` |
| GET | `/api/debug/contar-usuarios` | any authenticated | Temporary tenant-filter probe (remove in a later phase) |

**Stock golden rule:** every change to `Produto.QtdEstoque` goes through a `MovimentoEstoque` record (audit trail with user, type, quantity, reason). There is no endpoint that edits stock directly; negative stock is rejected with 400.

**Sales model:** a sale's `Total` is what was sold; each `Pagamento.Valor` is what was actually received. `Saldo = Total − Σ Pagamentos` is **calculated, never stored**, and `Status` (`Paga`/`Parcial`/`Pendente`) is derived on every payment. Paying off fiado inserts a new `Pagamento` on the existing sale; overpayment is rejected (400). `Servico` items (e.g. screen-protector application) do not touch stock.

**Concurrency:** selling a product runs an atomic conditional `UPDATE Produtos SET QtdEstoque = QtdEstoque - @qtd WHERE Id = @id AND LojaId = @lojaId AND QtdEstoque >= @qtd`. If two operators race for the last unit, exactly one succeeds and the other gets 409 — stock never goes negative. The whole sale is one transaction; any failure rolls back everything.

**Finance golden rule — "vendido ≠ recebido":** `vendido` is accrual (Σ sale totals dated inside the period) while `recebido` is cash (Σ payments received inside the period). A credit sale sold last month but paid today counts in *today's* `recebido` only; `emAberto` is `Σ(Total − ΣPagamentos)` accumulated across **all** sales and is deliberately **not** period-filtered, so it stays the same no matter which window you query. The cash register (`Caixa`) tracks physical drawer money: one open caixa per store (409 to open a second), and cash sales/payments require one (400). Movement sign is fixed by type — `Abertura`/`VendaDinheiro`/`Suprimento` are inflows, `Sangria`/`PagamentoConta`/`Estorno` are outflows. On `fechar`, `valorFechamentoCalculado = Σentradas − Σsaídas` and `diferenca = informado − calculado`. Card/PIX sales never hit the drawer; only `Dinheiro` does.

**SQLite note:** EF Core cannot translate `Sum`/`OrderBy` on `decimal` to SQLite, so reports materialize rows and aggregate on the client (fine for a gallery store's catalog). On PostgreSQL (migration backlog) these run server-side again.

Suspension is enforced in two places: login returns 403 for users of inactive stores, and `LojaAtivaMiddleware` rejects **every request** from a suspended store — including tokens issued before the suspension.

## Security notes

- `Jwt:Key` is never committed; `appsettings.json` ships an empty placeholder.
- Local SQLite files (`*.db*`) and `appsettings.Development.json` are gitignored.
- CORS is restricted to the frontend origin (`http://localhost:3000` in development); add the production origin to the `Frontend` policy in `Program.cs` when deploying.
- Pre-deploy backlog: rate limiting on login, stronger password policy, HTTPS enforcement, forced password change for the seeded admin, refresh tokens (today an 8h JWT simply expires and the operator logs in again).