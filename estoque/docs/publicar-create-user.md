# Publicar a criação de usuários

O erro HTTP 404 `Requested function was not found` significa que a Edge Function ainda não foi publicada. Executar os SQLs não publica funções TypeScript.

1. No projeto Supabase `tvyihitzacbzkzalkgcv`, abra **Edge Functions → Secrets**. Cadastre `APP_ORIGIN` com valor `http://127.0.0.1:5501` para o servidor local atual. Sem barra final ou caminho `/estoque/`. Quando mudar a hospedagem, atualize para a origem exata do site.
2. Vá a **Edge Functions → Deploy a new function → Via Editor**.
3. Nomeie a função exatamente **create-user**.
4. Substitua o conteúdo do arquivo `index.ts` do editor pelo conteúdo completo de `estoque/supabase/create-user-dashboard.ts` e publique. Esse arquivo inclui os validadores e não depende dos imports locais. Não cole no SQL Editor.
5. As credenciais administrativas são lidas do ambiente da função. Não cole chave ou senha no código. A função valida a sessão com Auth e exige administrador ativo com MFA pela RPC `can_manage_users` antes de criar qualquer acesso.
6. Garanta que 001–011 foram aplicadas. No programa local, atualize a página, entre novamente, confirme MFA e teste a criação. O resultado aparece abaixo do formulário.

Se ocorrer 401 antes de executar a função, confira nos logs se o gateway está rejeitando o JWT. Projetos com chaves de assinatura novas podem exigir desabilitar a verificação JWT legada do gateway; mantenha obrigatoriamente a validação `getUser` e `can_manage_users` no código. Nunca remova essas verificações para contornar falhas de acesso.

Se o serviço informar login criado/perfil não confirmado, não repita o cadastro: confira a migração 011 e o perfil no banco. O serviço não apaga usuários automaticamente.

Para regenerar o arquivo único depois de alterar a função ou validadores: `node scripts/prepare-create-user.mjs`.

Referências: [editor do Supabase](https://supabase.com/docs/guides/functions/quickstart-dashboard), [variáveis de ambiente](https://supabase.com/docs/guides/functions/secrets).
