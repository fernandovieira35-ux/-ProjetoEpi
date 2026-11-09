---
name: design-system-airbnb
description: Aplica a identidade imobiliária verde inspirada na experiência do Airbnb às vitrines e páginas de imóveis deste projeto HTML e CSS.
---

# Design imobiliário

1. Consulte `src/assets/css/projeto/variables.css`, fonte única de tokens. A referência de experiência é https://www.airbnb.com.br/: descoberta por fotos, informações resumidas nos cards e detalhes progressivos. Não copie marca, logotipo ou cores do Airbnb.
2. Use a paleta verde-água do projeto: superfície branca, fundo suave, texto escuro, verde profundo para ações e verde claro para destaques. As medidas abaixo são decisões locais, não medidas oficiais do Airbnb.
3. Use fonte de sistema, corpo de 16px, textos auxiliares de 12/14px e títulos de 24/32/48px; entrelinha 1.5, títulos 1.15. Consuma os tokens correspondentes.
4. Use escala de espaços 4, 8, 12, 16, 24, 32, 48, 64 e 80px. Raios de 8, 16 e 24px; pílulas com raio máximo. Limite o conteúdo a 1200px.
5. Componha layouts com Flexbox, fotos com object-fit cover, cards sem excesso de bordas, divisores leves e sombra discreta apenas onde há elevação.
6. Nos detalhes, apresente título, localização, galeria, especificações, descrição, comodidades, preço e localização ilustrativa. Identifique dados fictícios. Use links de âncora e scroll-snap para galeria sem JavaScript; não simule reserva ou envio real.
7. Preserve foco visível, alvos de pelo menos 44px, contraste, texto alternativo e navegação por teclado. Respeite redução de movimento.
8. Em até 760px, empilhe colunas; em até 480px, simplifique cabeçalho e cards. Media queries usam valores literais porque custom properties não funcionam nessas condições.
9. Valide em celular e desktop e registre limitações reais. Novos valores reutilizáveis devem entrar em `variables.css`, evitando escalas paralelas por página.

## Referência aplicada na vitrine

- Priorize descoberta no topo: introdução curta, navegação central segmentada e arredondada, seguida da seleção de imóveis. Evite um banner alto que empurre os cards para baixo.
- A barra é navegação para a seleção e seus tipos; não deve parecer um formulário de busca livre que não funciona.
- Use filtros nativos de rádio para todos, casas e apartamentos; CSS `:has()` controla a visibilidade dos cards por `data-type`. Preserve operação por teclado e o estado selecionado visível.
- Cards têm imagem quadrada, selo sobre a foto e hierarquia curta de nome, localização, características e preço. Mantenha a largura dos cards ao filtrar.
- Nos detalhes, links com miniaturas identificam as fotos do carrossel. Preserve o nome acessível de cada link.
- A página do Airbnb foi consultada novamente em 28/09/2026: categorias, busca segmentada e organização de navegação são referências. Os filtros de imóveis e a paleta são adaptações da Morada, não recursos ou medidas extraídos do Airbnb.
