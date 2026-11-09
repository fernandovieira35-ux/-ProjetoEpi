---
name: arquitetura-pastas
description: Organiza HTML e CSS deste projeto imobiliário e orienta a criação de páginas e utilitários Flexbox reutilizáveis.
---

# Arquitetura de pastas

1. Leia `.agente/context/projeto.md` e confira os arquivos existentes antes de mover ou criar conteúdo.
2. Mantenha `index.html` e `imovel.html` na raiz. Coloque recursos em `src/assets/`.
3. Separe `src/assets/css/` em `projeto/` e `paginas/`.
4. Em `projeto/variables.css`, declare tokens em `:root`. Em `projeto/global.css`, importe os tokens primeiro e mantenha reset, acessibilidade e utilitários agnósticos Flexbox. Em `projeto/componentes.css`, coloque cabeçalho, botões e demais componentes compartilhados.
5. Em `paginas/`, coloque somente estilos específicos de cada página. Carregue global, componentes e página, nessa ordem, no HTML.
6. Reutilize `.flex`, `.flex--1`, `.flex--column`, `.flex--wrap`, `.items--center`, `.justify--between` e `.gap--4`. Separe palavras e modificadores de classes com dois hífens; nunca `.flex-1`.
7. Guarde imagens locais em `src/assets/images/` quando houver arquivos. Documente fontes externas e não crie pastas vazias.
8. Confira caminhos relativos, navegação e larguras de celular e desktop. Registre decisões duradouras em `.agente/memory/decisoes.md`.

Ao receber pedido apenas de arquitetura, documente a estrutura sem gerar CSS. Gere arquivos de implementação quando solicitado explicitamente.

Formato consultado: https://antigravity.google/docs/skills. `.agent/skills` é compatível com o Antigravity; cada skill tem seu próprio `SKILL.md`, fora de `GEMINI.md`.
