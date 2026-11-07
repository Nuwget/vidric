# Vidric — Playground de Tema (ferramenta de design)

Seletor interativo de tokens de tema (estética "liquid glass") para **investigar e escolher as cores do Vidric antes de codar o frontend**.

**Isto NÃO é parte do produto.** É uma ferramenta de design autossuficiente (um único `index.html`, sem build). **Nunca** importe este código para o `frontend/` da Fase 4.

## Como usar

1. Abra `index.html` no navegador (basta dar dois cliques).
2. `Ctrl/Cmd + Shift + K` (ou o botão 🎨 no canto) abre o **painel dev de tema**.
3. Mude qualquer cor/efeito → aplica ao vivo no mock do PDV e **salva sozinho** no `localStorage`. Recarregue a página e o tema continua igual.
4. Atalhos: presets **Vidric / Oceano / Pôr do sol**, toggle **Light/Dark**, e **Copiar CSS vars** / **Copiar JSON** para exportar o tema escolhido.
5. Parâmetros de URL para estados fixos (útil para prints): `?mode=dark&drawer=open`, `?mode=light&cart=open`, `?panel=open`, `?preset=oceano`.

## Tokens expostos

- **Destaque (accent)** — padrão verde Vidric `#2E7D32` (a identidade; é o que vai para a Fase 4).
- **Erro / alerta** — padrão `#D32F2F`.
- **Aviso (warning)** — padrão `#f9a825`; usado no banner "caixa fechado". O texto é derivado (`darken(.43)` no light, `lighten(.30)` no dark) para manter contraste sobre o fundo claro.
- **Fundo & texto** — light (branco/cinza-claro) e dark (preto/cinza-escuro com toque de roxo).
- **Vidro líquido** — matiz, opacidade, blur, alpha da borda e raio.

Em dark, o texto de destaque (logo, preços) é derivado em **verde-claro** para manter contraste; os "em breve" da sidebar usam opacidade ≥ 50% + ícone de cadeado.

## Fonte de verdade do tema

Os tokens **exportados** (botão "Copiar CSS vars") são a **fonte de verdade** do tema Vidric. Na Fase 4, o Qoder deve **ler este `index.html` e copiar as CSS variables para o `globals.css` do Next.js** — não recriar a paleta do zero.

## Screenshots

Prints de validação (375px light/dark) são gerados localmente em `screenshots/` e **não** são versionados (ver `.gitignore`).
