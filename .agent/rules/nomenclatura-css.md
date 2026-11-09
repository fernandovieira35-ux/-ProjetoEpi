---
trigger: always_on
description: Padroniza classes CSS e tokens compartilhados do projeto.
---

# Classes e variáveis

- Separe palavras e modificadores de classes exclusivamente por `--`: `.flex`, `.flex--1`, `.property--card`, `.text--muted`.
- Não use hífen simples nem sublinhado em classes novas. Propriedades CSS nativas não são afetadas.
- Use custom properties semânticas de `src/assets/css/projeto/variables.css` para cores, tipografia, espaçamentos, bordas, raios e sombras. As variáveis seguem nomes como `--color-brand`.
- Utilitários em `projeto/global.css` devem ser agnósticos; seletores de páginas ficam em `paginas/`.
- Mantenha a interface em HTML e CSS, sem JavaScript, bibliotecas ou build.

Referência de frontmatter e ativação: https://antigravity.google/docs/rules/.
