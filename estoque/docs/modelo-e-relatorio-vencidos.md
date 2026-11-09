# Planilha completa e relatório de vencidos

## Importação

Na tela **Importação Excel**, escolha o tipo de importação e clique **Baixar planilha de exemplo completa**. O arquivo `.xlsx` possui uma aba de dados (Cadastros ou Restauracao), com três exemplos fictícios, e uma aba Instrucoes separada. Não há comentários sobrepostos às células. As categorias são escolhidas entre as autorizadas ao usuário; os códigos de exemplo não coincidem com os itens já consultados.

| Coluna | Conteúdo |
| --- | --- |
| codigo | Código único do EPI, até 40 caracteres |
| nome | Nome do equipamento, até 120 caracteres |
| categoria | Nome exato de uma categoria existente e autorizada |
| unidade | `un`, `par` ou `caixa` |
| minimo | Estoque mínimo inteiro, de 0 a 1000000 |
| ca | CA em texto, até 10 dígitos; substitua os exemplos fictícios |
| validade_meses | Prazo após entrega, de 1 a 120 meses; vazio significa sem alerta |
| saldo | Apenas no modelo de restauração administrativa, inteiro de 0 a 1000000 |

Os modelos de novos cadastros e restauração têm sete e oito colunas, respectivamente. Mantenha os cabeçalhos e a ordem. Não acrescente outras abas nem fórmulas. O importador ignora a aba Instrucoes do modelo oficial; modelos antigos de uma única aba continuam aceitos. CA como texto preserva zeros iniciais. Revise os dados fictícios e confira a prévia antes de confirmar. Novos cadastros começam sem saldo; registre uma entrada depois. Para restaurar saldos reais, prefira a exportação atual do inventário à planilha de exemplo. Modelos antigos continuam aceitos.

## Relatório exclusivo

Na tela **Validade e trocas**, use **Relatório de vencidos / PDF** para imprimir ou salvar pelo navegador, ou **Exportar vencidos em Excel** para obter os dados detalhados.

O relatório consulta os dados novamente e inclui todas as entregas vencidas até hoje, ainda sem substituição, dentro das categorias autorizadas. É independente do filtro da lista: selecionar “A vencer” não muda o relatório de vencidos. Registros sem prazo não são presumidos vencidos. Se não houver pendências, o relatório informa isso.

O documento A4 retrato tem logotipo Transcol, identificação de demonstração quando aplicável, data de referência em Brasília, emissão, responsável, escopo e resumo. Agrupa os registros por colaborador, incluindo nome, documento RG/CPF completo disponível ao perfil operacional, setor e identificador. Cada entrega apresenta código/nome do EPI, CA, quantidade/unidade, prazo, data/hora da entrega, troca prevista, dias de atraso, motivo, responsável e identificadores de rastreabilidade. O cadastro atual do equipamento (categoria, CA, prazo, saldo, mínimo e data de cadastro) aparece separado do histórico da entrega. Datas de cadastro ausentes são identificadas como não informadas.

Administradores e operadores usam o mesmo escopo de acesso já aplicado às entregas. Leitores não podem emitir o relatório nominal. A exportação Excel contém abas Resumo e Vencidos. Quantidades de unidades diferentes não são somadas no resumo. O relatório não encerra alertas nem altera estoque.

Não é necessária migração adicional para estes botões; o controle de validade depende da migração 006 já documentada. Teste local: `.tools/node.exe estoque/tests/expired-report.cjs`, cobrindo download/importação da planilha, relatório com logo, PDF, Excel e autorização.
