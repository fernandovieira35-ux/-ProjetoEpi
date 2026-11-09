# Painel executivo

Objetivo: mostrar à diretoria entregas por colaborador/setor, evolução e relatório exportável sem misturar unidades nem violar permissões.

Implementação: seção própria com filtros, funções puras de agregação, gráficos acessíveis, atualização manual/periódica, Excel com sete abas e impressão independente. Sem alteração de esquema. Dados demonstrativos vinculados a recebedores fictícios.

Validação: testes de agregação de datas inclusivas, nomes iguais, unidades e saídas não vinculadas; navegador para filtros, exportação, impressão, permissões e responsividade. Integração real permanece dependente do projeto Supabase configurado.

Resultado: `analytics.mjs`, `executive.cjs` e suíte existente `browser.cjs` aprovados. Excel baixado e reaberto com sete abas/contagens conferidas. Rotina registrada no intervalo de 60 segundos exercitada com nova entrega e atualização de 10 para 11 requisições. PDF executivo gerado e exclusão do inventário verificada. Responsividade conferida em 320/390/768/1440 px e operador/leitor sem ampliação de acesso.
