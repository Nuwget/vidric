# Vidric — Agent rules (repo conventions)

Durable operating rules that apply to **every phase**. These override convenience or speed.

## Process safety — HARD RULE

- **Never kill a user process.** No `taskkill`, `Stop-Process`, `kill`, `killall`, or any termination of `msedge.exe`, `chrome.exe`, `node.exe`, `dotnet.exe`, IDEs, editors, or anything the user may be running. Killing is **irreversible and invisible** to the user until they notice lost tabs/work.
- **Headless browser work:** use `msedge --headless=new --user-data-dir=<temp profile>`. A separate temp profile does not touch the user's running browser. (Classic `--headless` can be routed to an already-running instance and silently no-op; `--headless=new` runs independently.)
- **To free a port:** run on an alternate `--port`/`--urls`; do **not** kill whatever holds the port.
- **Unsure how to proceed safely?** Ask the user before acting.

## Theme — source of truth

- Design tokens live in [`theme-playground/index.html`](theme-playground/index.html) as CSS variables. In `frontend/`, **copy** them into `src/app/globals.css`; **do not recreate or invent a palette.**
- **Every token the app uses must exist in the playground first**, in both light and dark, including derived text colors (`--warning` / `--warning-text` / `--warning-soft` are `DEFAULTS.warning` + `apply()` in the playground, and `globals.css` copies what `apply()` emits). A token that only exists in `globals.css` turns the playground into a suggestion instead of the source of truth.
- Breakpoints must stay **identical** to the playground: `< 768px` = 1 column + bottom-sheet cart + nav drawer; `≥ 1024px` = 2 columns with sticky cart. A 604px viewport is **mobile**, not desktop — measure at 375px and 1440px, never in between.
- Default accent = Vidric green `#2E7D32` (the brand identity). Light/dark secondary text and glass alphas are derived for contrast (see playground). The `oceano` and `pesca` presets are **investigation tools only** — Vidric ships green.
- **Glass is CSS `backdrop-filter: blur()`, not WebGL.** This is a deliberate product decision, not a fallback: the target device is a low-end Android in the 150–300 USD range, where a WebGL compositor costs battery and frame drops. Do **not** add WebGL/shader-based glass without an explicit discussion and a decision recorded here.
- **Emoji icons do not render in headless/CI.** Use inline **SVG** for icons (e.g. the "em breve" lock).

## Domain invariants — do not "fix" these

- **`vendido ≠ recebido`, by design.** `vendido` is accrual (sale totals dated in the period), `recebido` is cash (payments received in the period), `emAberto` is accumulated across **all** sales and is deliberately **not** period-filtered. Never try to make the three dashboard numbers add up — that would destroy the meaning.
- **`Saldo` is calculated, never stored.** Two sources of truth always diverge. Same rule for `Status` (`Paga`/`Parcial`/`Pendente`), derived on every payment.
- **Every change to `Produto.QtdEstoque` goes through a `MovimentoEstoque`** (audit trail: user, type, quantity, reason). No endpoint edits stock. No exceptions.
- **SQLite cannot translate `Sum`/`OrderBy` over `decimal`.** Reports materialize rows and aggregate client-side. This is recorded debt tied to the PostgreSQL migration in the backlog — do not "optimize" it back into SQL without switching providers.

## Validation before commit

- **Run the phase checklist before committing, and never `git push` with checklist tests failing.** A green suite is the definition of done for a phase, not the code.
- **Rebuild before any manual or headless test.** Phase 3b was debugged for a while against a stale binary: `dotnet test`/`dotnet run` after source edits needs a real build, and `--no-build` on a stale artifact produces results that look like bugs.
- Frontend e2e runs against the real API (`http://localhost:5080`), and the API's CORS policy only allows `http://localhost:3000` — the Playwright suite must therefore run on port 3000. If 3000 is occupied, **ask** before doing anything about it (see the hard rule); do not silently move the suite to another port.

## Git & secrets

- **English Conventional Commits**, one commit per logical unit, **no co-author trailers**.
- GitHub noreply identity; **do not change global git config**.
- Secrets out of source: `Jwt:Key` via `dotnet user-secrets` (dev) and `Jwt__Key` env var (prod); `appsettings.json` ships an empty placeholder.
- Validation screenshots (`theme-playground/screenshots/`, `frontend/screenshots/`) are **gitignored** — not committed.
