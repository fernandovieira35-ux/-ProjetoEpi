# Hospedagem em GitHub Pages

Git é controle de versão. GitHub Pages é a hospedagem estática sugerida a partir do pedido; o banco e o Auth ficam no Supabase. O repositório Git local está inicializado; a publicação remota ainda está pendente. O procedimento atual com workflow e primeiro administrador está em [publicação inicial](publicacao-inicial.md); utilize esse procedimento em vez da publicação direta da branch descrita abaixo.

1. Concluir configuração e verificações do README e de segurança.
2. Criar um repositório para o sistema. Copiar o conteúdo de `estoque/` para ele; preferir repositório privado quando o plano permitir Pages com a visibilidade desejada. O site e seus arquivos JavaScript são visíveis a visitantes mesmo quando os dados exigem login.
3. Não enviar `.tools`, `.verificacao`, `.env`, planilhas reais, dumps ou qualquer segredo.
4. Em Settings → Pages, configurar publicação da branch principal/raiz. Apenas `index.html` e `assets/` são necessários para servir o aplicativo. Documentação e SQL não contêm segredos, mas podem ficar fora do artefato publicado.
5. Usar HTTPS. No Supabase, configurar URL do site e lista restrita de redirects para o endereço publicado, sem curingas amplos. O login desta versão usa senha/TOTP; recuperação é feita pelo administrador.
6. Testar a URL final, conexões com o Supabase, impressão/PDF e perfis reais. Não declarar produção validada apenas porque o HTML abriu.

Se publicar o repositório completo da aula, a raiz redireciona para o aplicativo; também é possível acessar o sistema em `/NOME-DO-REPOSITORIO/estoque/`. Os caminhos do aplicativo são relativos e suportam esse cenário.

Para proteção HTTP completa, usar host estático/proxy com cabeçalhos configuráveis. Ler as limitações de GitHub Pages no documento de segurança antes de escolher o ambiente definitivo.
# Atualização: CA e validade após entrega

Para a versão atual, aplique também `supabase/006_validade_ca.sql` após as migrações 001–005. Ela adiciona CA/prazo, snapshots de entrega e vínculo de substituição. Consulte [validade e CA](validade-ca.md). A aplicação remota desta migração e testes via Auth/PostgREST ainda estão pendentes.


## Numeração automática

Aplique também `supabase/007_codigo_sequencial.sql` após 006 para habilitar o cadastro sequencial. Verifique o último/próximo código e dois cadastros simultâneos em sessões reais antes de produção. Veja [código do EPI](codigo-epi.md).

## Catálogo de motivos

Aplique `supabase/008_motivos.sql` após 007 para habilitar motivos cadastrados com aviso. Valide seleção, desativação, uma entrega e restauração Excel no projeto real. [Guia](motivos.md).

## Edição e exclusão de motivos

Aplique `supabase/009_editar_excluir_motivos.sql` após 008. Autoriza somente administradores com MFA a editar/excluir motivos e registra as ações em auditoria. A navegação do logotipo não exige migração.

## Ajustes de saldo e perfis

Aplique `supabase/010_ajuste_saldo.sql` após 009 e republique `create-user`. Teste com sessões reais de administrador e simples; valide bloqueio de entradas, ajustes e restauração para simples, entregas permitidas e concorrência com saldo esperado. [Guia](ajuste-saldo-perfis.md).
