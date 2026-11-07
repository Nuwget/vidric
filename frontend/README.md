# Vidric frontend

Next.js 15 (App Router) storefront for the store counter: liquid-glass login, protected shell with
sidebar/header/caixa banner, and the PDV (product search, cart, protector + application shortcut,
payment modal).

Setup, the demo store and the Playwright checklist are documented in the
[repository README](../README.md#running-the-frontend).

```bash
npm run dev      # http://localhost:3000 (API expected at http://localhost:5080)
npm run build
npx playwright test
```

- Design tokens are copied verbatim from `../theme-playground/index.html` into `src/app/globals.css`.
  Change the theme there, then port the variables — do not invent colors here.
- Breakpoints follow the playground: `<768px` single column with cart bottom sheet + nav drawer,
  `768–1023px` single column with stacked cart, `≥1024px` two columns with sticky cart.
- Business rules (cash needs an open caixa, last-unit conflicts return 409, partial payment stays
  `Parcial`) are enforced by the API; the UI only reflects them.
