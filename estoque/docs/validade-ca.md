# CA e prazo de troca após entrega

Em **Cadastro de EPIs**, informe o número do CA (1 a 10 dígitos) e o prazo de troca em meses (1 a 120). Para itens existentes, use **Configurar CA e prazo de EPI existente**. Campos em branco significam não informado; prazo em branco não gera alerta. O CA é um registro informado pelo responsável, sem consulta automática de autenticidade ou situação.

O prazo representa o período de uso a partir da entrega, definido pelo responsável pelo cadastro. Não é a data de validade do certificado CA nem a validade de armazenamento do produto. Exemplo: entrega em 01/11/2026 com seis meses gera troca prevista em 01/05/2027. Quando o mês de destino não possui o mesmo dia, usa-se o último dia do mês (31/08 + seis meses = 28/02 ou 29/02). A referência de data é America/Sao_Paulo.

Cada nova requisição registra uma cópia do CA, prazo, dia da entrega e data de troca calculados no servidor. Alterar o cadastro depois não modifica essas cópias. Entregas antigas sem esses dados são exibidas na contagem **sem prazo registrado**; não recebem datas presumidas. Não há preenchimento retroativo automático.

## Alertas e substituição

- Um aviso aparece nas telas após login para administradores e operadores com entregas acessíveis vencidas ou a vencer. Leitores não recebem dados pessoais dos colaboradores.
- **Validade e trocas** lista colaborador, setor, EPI, CA, quantidade, entrega, prazo e data prevista. Os filtros são Vencidos, Vencem nos próximos 30 dias e Todos com prazo em aberto.
- A entrega é classificada como vencida a partir da data de troca, inclusive naquele dia. O período de antecipação é de 30 dias.
- **Registrar troca** preenche uma nova saída com o mesmo colaborador, EPI e quantidade. Confira e confirme a movimentação. A seleção **Substitui uma entrega anterior** pode ser feita também diretamente no formulário de entrega.
- Uma substituição deve cobrir toda a quantidade da entrega anterior. Trocas parciais ou por outro código de EPI não encerram esse alerta nesta versão. Uma saída comum sem vínculo também não encerra alertas antigos.
- A nova entrega reduz o estoque e registra o vínculo com a anterior numa única transação. A anterior sai dos alertas pendentes, mas permanece no histórico. A nova começa seu próprio prazo conforme o cadastro vigente. Reenvio da mesma solicitação não duplica a saída.
- Atualização após login/movimentações, por botão e a cada 60 segundos com a página aberta e visível. Não há e-mail, push ou aviso com o sistema fechado. Falhas de atualização mantêm a última consulta e apresentam erro; use Atualizar alertas para tentar novamente.

CA e prazo aparecem no inventário; a requisição impressa inclui CA, prazo e data prevista. A impressão geral inclui a lista de validade no filtro escolhido. Alterar o filtro para Todos antes de imprimir inclui também entregas ainda no prazo.

## Excel

O modelo novo tem `codigo,nome,categoria,unidade,minimo,ca,validade_meses`. A exportação de inventário acrescenta `saldo` ao final. Guarde CA como texto no Excel para preservar zeros iniciais. Planilhas antigas sem os dois campos continuam aceitas. Restauração com os campos novos exige que CA e prazo correspondam ao cadastro existente; divergência aborta toda a transação. Planilhas antigas preservam os valores existentes. Excel de inventário não é backup das entregas, datas ou vínculos de troca.

## Implantação e verificação

Aplique `supabase/006_validade_ca.sql` após 001–005 no SQL Editor antes de disponibilizar a interface atualizada em produção. Migração preserva RLS, MFA e bloqueio de primeiro acesso; funções auxiliares antigas passam ao schema privado sem permissão de execução direta pelos usuários. Não há nova chave no navegador.

Na demonstração, CAs são fictícios e duas entregas de botinas têm datas antigas para mostrar um vencimento e um aviso antecipado. Isso reduz os totais do painel executivo no filtro padrão dos últimos 30 dias: amplie o período para incluir todo o histórico. Recarregar restaura a demonstração.

Testes locais: `estoque/tests/epi-expiry.mjs` (calendário, migração, snapshots, troca, importação/restauração e autorização) e `estoque/tests/epi-expiry-ui.cjs` (alertas, cadastro, Excel, impressão, leitor e responsividade). A aplicação da migração e validação via Supabase Auth/PostgREST reais ainda estão pendentes.
