# Cadastro de motivos / referências

Em **Cadastros → Motivos / referências**, o administrador informa:

- **Motivo:** nome de 3 a 200 caracteres, por exemplo “Troca de EPI por prazo de uso”. Nomes repetidos, inclusive com diferença apenas de maiúsculas/minúsculas, são recusados.
- **Aviso ao selecionar:** orientação opcional, até 500 caracteres, exibida abaixo do campo na movimentação.

Os exemplos iniciais são Troca de EPI por prazo de uso, Troca de EPI por danificação, Entrega inicial de EPI, Reposição de estoque e Compra de EPIs. Podem ser criados outros motivos. Não é necessário repetir o nome no aviso: o sistema já mostra o motivo selecionado.

Em **Entregas e histórico**, Motivo / referência agora é uma lista obrigatória. Apenas motivos ativos aparecem. Antes da seleção, a mensagem apresenta “Exemplo: Troca de EPI por prazo de uso”. Depois, mostra o motivo escolhido e sua orientação. O fluxo Registrar troca continua preenchendo o motivo por prazo de uso quando ele está ativo; se estiver desativado, escolha outro motivo disponível.

A tabela de motivos permite **Editar**, **Desativar/Ativar** e **Excluir**. Editar carrega o nome e o aviso no formulário; use Salvar alterações ou Cancelar edição. Excluir pede confirmação e remove o registro do catálogo, inclusive se já usado; o texto nas movimentações e requisições anteriores permanece preservado. Desativar mantém o cadastro para reativação posterior. Operadores podem selecionar motivos, mas somente administradores com MFA gerenciam o cadastro. Leitores não têm acesso a este cadastro.

O banco valida o motivo nas novas entradas e saídas, inclusive entregas. Reenvios de uma movimentação já concluída preservam a idempotência. Restauração Excel continua registrando um motivo automático de sistema por função privada, sem exigir motivo do catálogo e sem permitir que usuários comuns chamem a função auxiliar.

## Implantação

Aplique `supabase/008_motivos.sql` após 001–007 e `supabase/009_editar_excluir_motivos.sql` em seguida. A primeira cria o catálogo e a segunda permite editar/excluir com autorização administrativa e auditoria. Ambas preservam motivos históricos. Integração Supabase real pendente.

Validação local: `estoque/tests/reasons.mjs` e `estoque/tests/reasons-ui.cjs`. Inclui RLS/MFA, cadastro, duplicidade, desativação, preservação do histórico, restauração e responsividade.
