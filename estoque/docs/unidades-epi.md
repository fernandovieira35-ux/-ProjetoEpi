# Unidades de estoque e entrega

Padrão operacional solicitado para a Transcol:

| EPI | Unidade | Quantidade 1 representa |
| --- | --- | --- |
| Luvas | par | Duas luvas |
| Botas e botinas | par | Dois calçados |
| Óculos | un | Um óculos completo |
| Abafador | un | Um abafador completo |
| Protetor auditivo tipo plug | un | Um conjunto completo para os dois ouvidos |

O nome digitado sugere a unidade no cadastro. A seleção pode ser ajustada para a apresentação real do produto; divergências exibem orientação. Na importação, os valores são preservados e divergências são avisadas na prévia. Não há bloqueio por palavras do nome nem conversão implícita de caixas, peças ou pares.

Saldo, mínimo e movimentações usam a mesma unidade cadastrada: saldo 10 pares menos entrega de 1 par resulta em 9 pares, não 8. A tela de entrega explica a unidade do item selecionado. Cadastros e saldos existentes não são convertidos automaticamente. Para corrigir um cadastro antigo com outra base de contagem, é necessário conferir o estoque físico e o histórico antes de definir a migração.

## Pesquisa em fornecedores

Consultados em 08/11/2026:

- [Ferramentas Gerais — luva Kalipso](https://www.fg.com.br/luva-nylon-cinza-p---kalipso/p): unidade par.
- [Super EPI — botina Cartom](https://superepi.com.br/p/botina-de-seguranca-cartom-em-elastico-com-bico-de-composite-tp085-ca-38753-p1067100): conteúdo de um par.
- [Neobetel — óculos Danny](https://www.lojaneobetel.com.br/oculos-sobrepor-incolor-netuno-danny-p2299): unidade de venda peça.
- [Neobetel — protetor Pomp Plus](https://www.lojaneobetel.com.br/protetor-auricular-de-silicone-pomp-plus-19-db-3m-p55): unidade de venda par.

Logo, “protetor auditivo sempre em unidade” é uma convenção interna para o conjunto completo, não uma regra universal dos fornecedores. A unidade da nota fiscal ou da embalagem deve ser conferida antes de registrar uma entrada. Luvas descartáveis também podem vir em caixas; uma caixa não equivale automaticamente a um par.
