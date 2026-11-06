# Vidric

Multi-tenant SaaS for gallery phone shops (screen protectors, cases, accessories and application services). Each store has isolated users and data; a Super Admin manages which stores exist and can suspend/reactivate them.

**Status:** Phase 3b — POS (PDV) with sales, sale items and partial payments, on top of Phase 3a (product catalog + stock + dead-stock report) and the Phase 2 Super Admin panel. Finance (3c) comes later.

## Stack

- .NET 8 / ASP.NET Core Web API
- Entity Framework Core 8 + SQLite (swappable to PostgreSQL later)
- JWT Bearer authentication (8h expiry), BCrypt password hashing
- Multi-tenancy: single database, `LojaId` column + EF Core global query filter
- Roles: `SuperAdmin`, `AdminLoja`, `Funcionario`
- Swagger with JWT "Authorize" button

## Solution layout

```
LojaGaleria.sln
└── src/
    ├── LojaGaleria.Domain/         entities, enums, ITenantProvider, stock service
    ├── LojaGaleria.Infrastructure/ AppDbContext, migrations, sale service
    └── LojaGaleria.API/            controllers, auth, middleware
└── tests/
    └── LojaGaleria.Tests/          xUnit (stock rules, sales concurrency/payments, tenant isolation)
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
| POST | `/api/vendas/{id}/pagamentos` | AdminLoja/Funcionario | Receive a payment on an existing sale (pay off fiado); rejects overpayment |
| GET | `/api/debug/contar-usuarios` | any authenticated | Temporary tenant-filter probe (remove in a later phase) |

**Stock golden rule:** every change to `Produto.QtdEstoque` goes through a `MovimentoEstoque` record (audit trail with user, type, quantity, reason). There is no endpoint that edits stock directly; negative stock is rejected with 400.

**Sales model:** a sale's `Total` is what was sold; each `Pagamento.Valor` is what was actually received. `Saldo = Total − Σ Pagamentos` is **calculated, never stored**, and `Status` (`Paga`/`Parcial`/`Pendente`) is derived on every payment. Paying off fiado inserts a new `Pagamento` on the existing sale; overpayment is rejected (400). `Servico` items (e.g. screen-protector application) do not touch stock.

**Concurrency:** selling a product runs an atomic conditional `UPDATE Produtos SET QtdEstoque = QtdEstoque - @qtd WHERE Id = @id AND LojaId = @lojaId AND QtdEstoque >= @qtd`. If two operators race for the last unit, exactly one succeeds and the other gets 409 — stock never goes negative. The whole sale is one transaction; any failure rolls back everything.

**SQLite note:** EF Core cannot translate `Sum`/`OrderBy` on `decimal` to SQLite, so reports materialize rows and aggregate on the client (fine for a gallery store's catalog). On PostgreSQL (migration backlog) these run server-side again.

Suspension is enforced in two places: login returns 403 for users of inactive stores, and `LojaAtivaMiddleware` rejects **every request** from a suspended store — including tokens issued before the suspension.

## Security notes

- `Jwt:Key` is never committed; `appsettings.json` ships an empty placeholder.
- Local SQLite files (`*.db*`) and `appsettings.Development.json` are gitignored.
- Pre-deploy backlog: rate limiting on login, stronger password policy, HTTPS enforcement, forced password change for the seeded admin, CORS when the frontend lands.