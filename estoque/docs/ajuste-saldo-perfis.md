# Ajuste de saldo, histórico e perfis

## Perfis disponíveis

| Operação | Administrador | Usuário simples |
| --- | --- | --- |
| Consultar inventário/histórico/relatórios autorizados | Sim | Sim |
| Cadastrar EPIs e colaboradores; configurar CA/prazo | Sim | Sim |
| Importar novos cadastros com saldo inicial zero | Sim | Sim |
| Registrar saída por entrega a colaborador | Sim | Sim |
| Registrar entradas de estoque | Sim | Não |
| Ajustar saldo diretamente | Sim | Não |
| Restaurar saldos por Excel | Sim | Não |
| Gerenciar usuários, perfis, categorias e motivos | Sim | Não |
| Alterar/apagar diretamente o histórico | Não | Não |

Novos acessos começam com **Usuário simples** selecionado. O papel técnico `operador` continua armazenado para compatibilidade com regras existentes, mas é apresentado como Usuário simples. O papel `leitor` antigo permanece somente consulta e não é oferecido na criação de novos usuários; pode ser mantido ao editar um usuário legado. Nenhum usuário antigo é promovido automaticamente. MFA, troca obrigatória de senha e escopos antigos de categoria permanecem.

## Ajustar saldo

Abra **Operação → Ajuste de saldo**, selecione o EPI, confira **Saldo consultado**, informe **Novo saldo**, escolha um motivo e registre. O ajuste aceita saldo inteiro de 0 a 100.000.000, com diferença máxima de 1.000.000 por operação, conforme o limite de movimentação existente. Saldo igual ao atual não gera ajuste.

O banco compara o saldo consultado com o atual sob bloqueio da linha do EPI. Se outra movimentação ocorreu, recusa a correção: use **Atualizar saldo consultado**, confira e tente novamente. O identificador da solicitação evita aplicar duas vezes um ajuste reenviado. O motivo precisa estar ativo.

Um ajuste aumenta ou diminui o saldo e gera uma movimentação identificada como ajuste, com auditoria. O registro não representa uma entrega a colaborador e não encerra alertas de validade. Entradas e ajustes são administrativos; usuários simples só reduzem saldo por entregas validadas, não por chamada direta de movimentação de estoque.

## Histórico

**Entregas e histórico** e sua exportação Excel incluem, para movimentos novos após a migração:

- Saldo anterior e saldo novo.
- Data e hora do servidor, exibidas no histórico no fuso de Brasília; Excel também mantém a data ISO.
- Nome de usuário autenticado (e-mail como alternativa) e identificador da conta.
- Motivo e indicação de ajuste.
- Estação informada, quando preenchida no ajuste.

Os snapshots são registrados também em entradas, saídas e restaurações administrativas. Dados antigos não são recalculados: aparecem como **Não registrado**. O histórico continua protegido contra UPDATE/DELETE direto pelos usuários, inclusive administradores da aplicação. O registro técnico de auditoria também identifica quem ajustou.

## Nome da máquina

Uma aplicação web comum não obtém automaticamente o hostname real da máquina. O campo opcional **Identificação da estação** permite informar, por exemplo, ALMOX-PC01. Esse texto é declarado pelo usuário, não é verificado, e é apresentado como “informada” no histórico. Não é IP, autenticação do dispositivo ou prova de qual computador foi usado. Entradas/saídas e restaurações sem esse campo ficam sem estação informada.

## Implantação e validação

1. Aplique `supabase/010_ajuste_saldo.sql` após 001–009.
2. Republique a Edge Function `create-user`, que agora aceita os dois perfis novos (admin e operador/simples).
3. Em sessões reais separadas, valide administrador e simples, entrega permitida, entrada/ajuste/restauração negados ao simples, concorrência com saldo desatualizado e histórico antes/depois.

Testes locais: `estoque/tests/stock-adjustment.mjs` e `estoque/tests/stock-adjustment-ui.cjs`. A implantação, a Edge Function e a concorrência real no Supabase continuam pendentes. Não foi alterada nenhuma senha ou permissão de produção neste workspace.
