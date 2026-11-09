# Excel e backup

## Novos cadastros

Baixe o modelo na interface. Uma aba, colunas nesta ordem: `codigo`, `nome`, `categoria`, `unidade`, `minimo`, `ca`, `validade_meses`. O modelo inclui três exemplos fictícios e instruções em aba separada. CA é texto numérico; prazo é de 1 a 120 meses ou vazio. Unidades: `un`, `par`, `caixa`. Categorias devem existir e estar autorizadas. Código repetido cancela todo o lote. Saldo inicial é zero: registre uma entrada depois.

## Restauração de inventário

A exportação Inventário gera uma aba com as mesmas sete colunas e `saldo`. Ela respeita os filtros e as permissões atuais. Para uma cópia completa do inventário, um administrador deve limpar busca e categoria antes de exportar. Limite de restauração: 500 linhas/2 MB por arquivo, saldo de 0 a 1 milhão por item; diferença de saldo de até 1 milhão por movimento.

1. Exporte e guarde o inventário atual antes de modificar dados.
2. Selecione “Restaurar saldos do inventário” em Importação Excel, com usuário administrador.
3. Envie o arquivo exportado e confira todos os registros na prévia.
4. Confirme. Itens novos são cadastrados; itens existentes precisam ter os mesmos nome, categoria, unidade, mínimo, CA e prazo (quando presentes na planilha). Modelos antigos sem CA/prazo preservam os valores existentes. Divergência cancela a transação. Não altera metadados existentes.
5. Cada diferença gera entrada/saída com referência ao lote. Itens ausentes na planilha ficam intactos. Nenhum histórico é apagado. A planilha é o saldo desejado, portanto uma cópia antiga pode desfazer o efeito de operações recentes: faça em janela sem movimentações e confira relatório após concluir.

Não restaura usuários, categorias, permissões, auditoria nem movimentos originais. Para recuperar esses dados, use backup PostgreSQL. Para transferir saldo a banco novo, cadastre categorias primeiro, depois restaure inventário; o histórico anterior continuará apenas no backup original.

## Backup completo do Supabase

Não presumir backup automático no plano gratuito. Verificar recursos e limites atuais no painel. Definir responsável, periodicidade, retenção e teste de restauração. Usar ferramentas oficiais Supabase CLI/pg_dump em estação confiável, nunca no navegador; credenciais via gerenciador de segredos. Não versionar dumps nem credenciais. Dados Auth e configurações do projeto requerem procedimento próprio; exportações das tabelas públicas não bastam para restaurar identidades.

Guardar cópias cifradas fora do projeto e registrar data, versão da migração, contagem por tabela e resultado do teste de restauração em ambiente isolado. Conferir usuários, vínculos, RLS e somatório dos movimentos versus saldos antes de retomar operação.

Referência: [backups Supabase](https://supabase.com/docs/guides/platform/backups).
