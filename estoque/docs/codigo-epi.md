# Código do EPI: sequencial ou manual

Em **Cadastro de EPIs**, o campo **Geração do código** inicia em **Sequencial automático (padrão)**. O código aparece somente para consulta e é reservado pelo banco ao salvar. Uma instalação sem códigos EPI inicia em EPI-001. O número possui pelo menos três dígitos: EPI-009, EPI-010, EPI-999, EPI-1000.

Ao escolher **Informar manualmente**, o campo fica editável e aparece um aviso com o último número da sequência (o maior já registrado) e o próximo previsto. Exemplo: último EPI-050, próximo EPI-051. Não significa necessariamente o último registro por data: códigos personalizados, como BOTA-A, não alteram a numeração. O formato digitado `EPI - 50` é convertido em `EPI-050` ao salvar; os códigos antigos não são renomeados.

O código manual deve ser único e seguir a validação existente de até 40 caracteres (letras, números, ponto, hífen e sublinhado). Códigos do padrão EPI com número superior ao atual avançam a sequência. Códigos menores não fazem a sequência voltar. O cadastro manual não modifica EPIs já existentes. Após sucesso e ao encerrar a sessão, o formulário volta ao padrão automático.

A numeração é global: inclui itens de outras categorias, mesmo quando o usuário só pode consultar algumas. Apenas os códigos último/próximo são expostos nessa consulta; não são expostos nomes ou dados dos itens de outras categorias. Administradores e operadores autorizados recebem essa informação; leitores e usuários sem MFA ou com troca de senha pendente não recebem.

Importação Excel continua usando a coluna codigo informada na planilha. Um EPI-050 importado também avança o próximo cadastro automático para EPI-051. Códigos EXEMPLO ou outros formatos não mudam a sequência. A previsão na tela pode mudar se outra pessoa cadastrar antes: o banco reserva o número definitivo em uma transação, com bloqueio compartilhado por cadastros e importações. A mensagem após salvar mostra o código efetivamente atribuído. Solicitações repetidas com o mesmo identificador não criam outro registro.

## Implantação

Aplique `supabase/007_codigo_sequencial.sql` depois das migrações 001–006. Ela inicia o contador pelo maior número já existente, cria um gatilho para INSERTs e uma função de cadastro idempotente. Contador e solicitações ficam no schema privado, sem leitura/escrita direta pelos usuários. Não exige chave adicional no navegador.

Testes locais: `estoque/tests/epi-code.mjs` e `estoque/tests/epi-code-ui.cjs` verificam início, manual/Excel, números maiores que 999, duplicidade, rollback, repetição, MFA, permissões e responsividade. A implantação e teste concorrente com sessões Supabase reais permanecem pendentes.
