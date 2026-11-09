# Transcol EPIs — atualização de usuários e MFA (proposta para homologação)

Esta entrega atualiza **código-fonte local**; não modifica o GitHub, o Render ou o Supabase em produção.

## Alterações

1. **Usuários > Excluir acesso:** botão de **inativação lógica** para usuários ativos que não sejam o administrador conectado. Confirmação obrigatória. Utiliza o RPC já existente `set_user_access`, cujo controle exige administrador ativo com AAL2. O cadastro e o histórico operacional permanecem no banco. É possível reativar o usuário em **Alterar permissões**. A exclusão física de `auth.users` **não** foi implementada, pois `movements.actor` referencia `profiles.id` e eliminar registros poderia comprometer a rastreabilidade.
2. **MFA / 30 dias:** opção no formulário do segundo fator para **manter a sessão MFA verificada** até 30 dias no mesmo navegador. A sessão deve permanecer válida no Supabase e manter `aal2`; não há salto de segundo fator nem elevação artificial para `aal2`. Ao recarregar, a aplicação verifica a identidade, o marcador local de expiração e o nível AAL2 antes de restaurar a sessão. Após o prazo, a sessão é encerrada na próxima verificação/carregamento. Logout explícito e troca de senha removem o marcador. **Não é um certificado de dispositivo confiável atestado pelo servidor**, nem garante autenticação apenas mensal em caso de logout, expiração/revogação da sessão ou troca de navegador. O token de sessão passa a ser persistido pelo SDK no armazenamento local do navegador: usar apenas em dispositivos confiáveis, revisar XSS e considerar medidas de segurança adicionais antes de produção.
3. **Authy:** instruções e link para download oficial na tela de MFA e na seção Meu acesso.
4. **QR Code:** exibir/ocultar o QR enquanto um novo fator estiver sendo cadastrado. Fatores TOTP confirmados **não têm QR Code original recuperável**. Em Meu acesso, o usuário autenticado em `aal2` pode iniciar cadastramento de novo autenticador, verificar seu código e somente então solicitar a remoção do anterior. Se a remoção do anterior falhar, deve-se revisar os fatores no Supabase. Não armazena segredo TOTP no banco.

## Limitações e aprovação

- A regra de **MFA obrigatório a cada 30 dias**, independentemente do estado da sessão, exige uma política servidor/Supabase compatível com AAL2 e validade máxima da sessão. O que foi implementado aqui é **persistência opcional de sessão MFA previamente validada por até 30 dias**, não um substituto de MFA. Não alterar as políticas RLS que exigem `aal2`.
- A opção de cadastro de novo autenticador exige o fator atual. Recuperação por perda de celular exige fluxo separado de recuperação administrativa, com prova de identidade fora da sessão comprometida.
- A opção “Excluir acesso” **inativa**; não apaga usuário, seus dados ou o histórico. Isso é intencional e deve constar na interface para evitar expectativas incorretas.
- O modo de demonstração não implementa autenticação MFA real.

## Testes realizados neste ambiente

- Sintaxe dos arquivos JavaScript alterados: `node --check` — aprovada.
- Geração estática com variáveis públicas fictícias (`node scripts/prepare-site.mjs`) — aprovada, incluindo os novos módulos.
- Testes completos de navegador e banco: **não executados**, pois o ZIP não contém as dependências locais `.tools` e `.verificacao` usadas por esses testes. É necessário homologar em ambiente separado.

## Implantação recomendada

1. Faça backup do código original e compare as diferenças.
2. Valide em uma branch de testes e ambiente de homologação, em especial: login, MFA, refresh de sessão, expiração aos 30 dias, troca de autenticador, administradores, auditoria e inativação de usuários.
3. Após a homologação, execute `git status`, `git add .`, `git commit -m "Gestão segura de usuários e sessão MFA opcional"` e `git push origin main` na pasta do projeto.
4. Render publicará o frontend pelo fluxo já existente, caso auto deploy esteja habilitado. Não há nesta entrega uma nova Edge Function nem migração SQL. Mantenha `create-user` implantada no Supabase.
