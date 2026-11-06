# Vidric

Multi-tenant SaaS for gallery phone shops (screen protectors, cases, accessories and application services). Each store has isolated users and data; a Super Admin manages which stores exist and can suspend/reactivate them.

**Status:** Phase 2 — Super Admin panel (store management, suspension with request-level blocking, dashboard). Business modules (products, POS, inventory, finance) come later.

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
    ├── LojaGaleria.Domain/         entities, enums, ITenantProvider
    ├── LojaGaleria.Infrastructure/ AppDbContext, migrations
    └── LojaGaleria.API/            controllers, auth, middleware
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
| GET | `/api/debug/contar-usuarios` | any authenticated | Temporary tenant-filter probe (remove in a later phase) |

Suspension is enforced in two places: login returns 403 for users of inactive stores, and `LojaAtivaMiddleware` rejects **every request** from a suspended store — including tokens issued before the suspension.

## Security notes

- `Jwt:Key` is never committed; `appsettings.json` ships an empty placeholder.
- Local SQLite files (`*.db*`) and `appsettings.Development.json` are gitignored.
- Pre-deploy backlog: rate limiting on login, stronger password policy, HTTPS enforcement, forced password change for the seeded admin, CORS when the frontend lands.