# Usuários e senhas

**Perfis atuais:** novos usuários são Administrador ou Usuário simples (padrão, papel técnico operador). Simples pode cadastrar EPIs/colaboradores e registrar saídas, mas não entradas, ajuste/restauração de saldo ou gestão de acessos. Leitor antigo permanece consulta. Veja [permissões e auditoria](ajuste-saldo-perfis.md). A migração 010 e republicação de create-user são necessárias para estas regras no ambiente real.

O acesso novo usa nome de usuário e senha. Nomes são únicos, normalizados em minúsculas, de 3 a 40 caracteres sem acentos/espaços. Perfis administrador, operador e leitor e MFA continuam em uso. A criação na tela Usuários chama uma Edge Function autenticada; a chave administrativa existe somente no servidor. A seleção de categorias foi removida: novos usuários acessam todas conforme seu perfil; restrições antigas são preservadas.

## Política da aplicação

- Pelo menos 12 caracteres.
- Maiúscula A–Z, minúscula a–z, número e símbolo.
- Até 72 bytes UTF-8, evitando ambiguidades com o limite tradicional de bcrypt. Acentos podem ocupar mais de um byte.
- Na troca: senha atual obrigatória, nova senha diferente e confirmação idêntica.

Em **Meu acesso**, os requisitos são mostrados conforme a digitação. Senhas não aparecem em relatórios nem são gravadas em localStorage, tabelas da aplicação ou logs. Após a tentativa de troca, o campo da senha atual é limpo; após sucesso, todos os campos são limpos. Use um gerenciador para criar uma senha exclusiva. Cumprir requisitos de formato não comprova que uma senha nunca foi vazada.

O formulário de login também recusa senhas fora da política. Usuários antigos com senha fraca precisam receber uma redefinição pelo administrador antes de acessar esta interface. Isso não substitui a configuração do servidor e não impede, sozinho, chamadas diretas ao Auth.

## Obrigatório configurar no Supabase real

**Não foi aplicado remotamente:** este workspace não possui projeto Supabase conectado ou credenciais administrativas. A regra no navegador pode ser contornada; a exigência efetiva para criação/troca pela API é configurada no Auth, não nas migrações PostgreSQL.

1. No painel do projeto, abra **Authentication → Sign In / Providers → Email** (ou configurações de segurança de senha do Auth, conforme a interface).
2. Defina **Minimum password length = 12**.
3. Escolha a opção de caracteres exigidos com **maiúsculas, minúsculas, números e símbolos**.
4. Ative **Require current password when changing password**. O formulário envia `current_password` no `updateUser`; a biblioteca local encaminha esse atributo ao servidor. Sem essa configuração, não se deve presumir que o servidor verifica a senha atual.
5. Mantenha cadastro público e acesso anônimo desabilitados. Depois de implantar a migração 005 e a função create-user, use Criar acesso na tela Usuários. O primeiro administrador ainda deve ser provisionado no Auth/SQL conforme implantação.
6. Se disponível no plano, habilite proteção contra senhas vazadas. A documentação consultada informa disponibilidade a partir do Pro; o aplicativo não depende desse recurso pago.
7. Antes de produção, teste diretamente a API: senha curta, ausência de uma das classes e senha atual incorreta devem falhar; uma senha forte válida deve funcionar. Verifique MFA e permissões depois da troca. Se reautenticação por código adicional for exigida em sessão antiga, entre novamente antes de tentar; esse fluxo de nonce não foi implementado.

Alterar regras do Auth não reescreve senhas antigas. Planeje redefinição dos usuários existentes que não atendam à política. A documentação do Supabase informa que usuários antigos podem continuar autenticando pela API mesmo com senha abaixo da nova regra; portanto não declarar o bloqueio da interface como garantia de revogação no servidor.

## Demonstração

Usuários demonstrativos continuam usando a credencial pública indicada na tela, que atende ao formato. Em Meu acesso, a troca é simulada somente na memória da aba e exige a senha atual. Recarregar restaura os acessos de teste; Sair mantém os usuários criados na memória da aba para testar o primeiro acesso. Nenhum dado é enviado ao Supabase. Não reutilize esse acesso público em produção.

## Implantar criação de acesso e primeiro login

1. Aplique as migrações 001 a 005 em ordem. A 005 adiciona nome de usuário e flag no perfil e gatilhos em `auth.users`. Faça isso antes de disponibilizar a nova interface.
2. No diretório `estoque`, vincule o projeto Supabase via CLI e publique `supabase functions deploy create-user`. A função está em `supabase/functions/create-user/index.ts`. Configure o segredo `APP_ORIGIN` com a origem exata do site, por exemplo `https://organizacao.github.io` (sem caminho/barra final). Não desative a validação JWT. As variáveis padrão SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY devem existir no ambiente da função; nunca copie a chave administrativa para config.js, Git ou navegador.
3. Configure a política forte e senha atual no Auth conforme a seção acima. Desabilite cadastro público. O primeiro administrador precisa existir com perfil ativo e MFA. Os administradores existentes continuam entrando por seu e-mail.
4. Teste com administrador em AAL2: criação, nome duplicado, senha fraca, usuário bloqueado, checkbox marcado e desmarcado. Com troca pendente, consulta de estoque e RPC de movimentação devem ser negadas, inclusive por API direta. Confirme a liberação somente após trocar a senha e verificar MFA. Teste o fluxo real de Auth e o gatilho antes de produção.

O Supabase Auth usa e-mail internamente: o nome é convertido de forma determinística para `nome@usuarios.transcol.invalid`, endereço técnico sem caixa postal. Não é solicitado nem exibido como campo de cadastro. Nomes são imutáveis nesta versão. Recuperação por e-mail não se aplica a esses logins; recuperação administrativa deve definir nova senha forte no Auth e marcar `must_change_password=true` no perfil via SQL administrativo. Não há botão de recuperação/reset administrativo nesta versão.

A função provisiona o perfil no mesmo INSERT do Auth por gatilho, usando apenas app_metadata administrativo. Usuários não podem liberar a flag pela API de tabelas nem por user_metadata. Um gatilho retira a exigência quando Auth altera efetivamente encrypted_password; não são copiados hashes ou senhas. Mudar perfil/situação preserva categorias antigas. Novos usuários têm all_categories=true, incluindo futuras categorias. Não converter usuários antigos automaticamente.

**Validação local:** testes PGlite do bloqueio RLS/RPC e gatilhos, fluxo demo de criação/troca e responsividade. **Pendente:** implantação e integração real de Edge Function, Auth, política de senha, MFA e gatilhos no projeto Supabase.

Comandos locais a partir da raiz: `.tools/node.exe estoque/tests/first-access.mjs` e `.tools/node.exe estoque/tests/first-access-ui.cjs`.

### Documentação oficial

- [Segurança de senhas do Supabase](https://supabase.com/docs/guides/auth/password-security)
- [Alterar usuário autenticado](https://supabase.com/docs/reference/javascript/auth-updateuser)
- [Criar usuário no servidor](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
