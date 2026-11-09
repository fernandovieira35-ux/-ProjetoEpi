# Publicação e primeiro administrador

O login solicitado é **adcmim**, exatamente com essa grafia. O script cria perfil `admin`, ativo, acesso a todas as categorias e troca obrigatória de senha. Ele só serve para um projeto sem administradores existentes; não redefine senhas nem promove contas antigas.

## Supabase

1. Crie um projeto exclusivo. Aplique os SQLs de `estoque/supabase/`, **001 a 010**, em ordem pelo SQL Editor. São migrações não repetíveis: se já aplicadas, execute somente as pendentes. Não execute scripts de testes ou dados demo no projeto real.
2. Desabilite novos cadastros públicos e login anônimo; habilite TOTP MFA. Aplique a política de senha e as configurações de [usuários e senhas](usuarios-e-senhas.md).
3. No PowerShell local, fora de gravação/transcrição de terminal, execute `./scripts/bootstrap-admin.ps1`. Informe a URL do projeto e a chave administrativa no campo oculto. A chave não é salva em arquivo. Execute apenas uma instância desse procedimento.
4. O script gera a senha com aleatoriedade criptográfica, cria o usuário pelo Auth Admin e confirma o perfil provisionado pelo trigger da migração 005. A senha de 24 caracteres aparece uma única vez no terminal após confirmação. Guarde-a em um gerenciador de senhas. Não cole no repositório nem em documentos.
5. Entre com `adcmim`, troque a senha e configure o autenticador. O e-mail técnico interno é produzido por `loginEmail`; não é uma caixa de e-mail para recuperação. Recuperação deve ser feita por um administrador no painel Supabase.
6. Publique a Edge Function `create-user` usando o código em `estoque/supabase/functions/create-user/index.ts`, preservando seus imports relativos de `estoque/assets/js/`. Defina `APP_ORIGIN` com a origem exata do site, por exemplo `https://seu-usuario.github.io`, sem o caminho do repositório. Mantenha validação de JWT e teste a criação de usuário com MFA no ambiente real.
7. Configure Site URL e redirects restritos à URL final. Execute os testes reais de permissão, troca de senha, MFA, saídas, ajuste de saldo e criação de usuários antes do uso operacional.

## GitHub e Pages

1. Envie o repositório para a branch `main`. Não inclua `.env`, `.secrets`, `.descarte`, `.tools`, `.verificacao`, `dist`, planilhas ou backups. O `.gitignore` contém essas exclusões.
2. Em Settings → Pages, selecione **GitHub Actions**.
3. Em Settings → Secrets and variables → Actions → **Variables**, configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. São parâmetros públicos; nunca utilize chave administrativa nesses campos.
4. Execute o workflow **Publicar sistema de EPIs**. Ele falha se a configuração pública estiver ausente ou inválida. Somente `estoque/index.html`, `assets/` e `docs/` entram no site. SQLs, testes, scripts de administração e o descarte Morada não são publicados.
5. No site publicado, o aplicativo abre diretamente na raiz do site Pages. Demonstração: acrescente `?demo=1`. Ela não usa a conta real `adcmim` nem acessa o banco real.

Para preparar o mesmo artefato localmente, defina as duas variáveis públicas e execute `node scripts/prepare-site.mjs` em uma árvore sem `dist/`. O arquivo original `config.js` não é sobrescrito. Para usar o sistema real no Live Server, configure separadamente esse arquivo somente com URL e chave publicável.

## Estado da preparação

Os scripts e o workflow não significam que o banco ou a conta já existem. Sem URL do repositório, projeto Supabase e autenticação administrativa local, publicação e provisionamento permanecem pendentes. GitHub Pages não permite configurar todos os cabeçalhos de segurança; consulte [segurança](seguranca.md) antes de escolher a hospedagem definitiva.

Referências: [Auth Admin do Supabase](https://supabase.com/docs/reference/javascript/auth-admin-createuser) e [workflows Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
