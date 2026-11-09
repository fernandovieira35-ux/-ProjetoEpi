# Revisão de segurança — 2026-11-08

## Usuários e senha forte

Nomenclatura atual: usuários/acesso; o identificador continua sendo e-mail. Login e troca validam mínimo de 12 caracteres, quatro classes e máximo 72 bytes. Tela Meu acesso exige senha atual e confirmação. Em produção envia `current_password` e `password` via Auth; nenhuma senha é gravada em tabelas próprias, logs ou armazenamento persistente do navegador. No demo, senhas de teste são mantidas somente em memória e restauradas na recarga.

**Pendente no ambiente real:** configurar Auth para mínimo 12, maiúscula/minúscula/número/símbolo e exigência de senha atual. A validação JavaScript não protege contra chamadas diretas à API. Não há como verificar retrospectivamente a força de hashes existentes; usuários antigos podem precisar de redefinição. Guia: `usuarios-e-senhas.md`. Testes locais de política, formulário demo, senha atual incorreta, confirmação, limpeza dos campos e regressão passaram; integração real não executada.

## Atualização: entregador automático (migração 004)

Substitui o comportamento de nome declarado descrito na implementação inicial abaixo: novas entregas obtêm `delivered_by` exclusivamente do usuário autenticado no banco (e-mail de auth.users ou UUID). A assinatura antiga com parâmetro de nome é removida; o frontend não envia esse campo. Requisições antigas permanecem como registradas. Campo somente leitura na tela é conveniência; a garantia está no RPC. Testes locais passaram em 42 verificações, incluindo rejeição da chamada antiga e identidade gravada automaticamente; suítes de navegador e demo também aprovadas.

## Colaboradores e requisições

Migração 003 cria tabelas `recipients` e `deliveries`, ambas com RLS e escrita direta revogada. Cadastro de recebedores é compartilhado entre administradores e operadores ativos com ao menos uma categoria atribuída e MFA. Leitores não consultam essas tabelas. Documentos completos ficam no cadastro e são acessíveis via API somente aos perfis operacionais autorizados; a máscara na tela não substitui a RLS. Requisições exigem acesso de escrita à categoria do item. Não há segmentação dos recebedores por setor: setor é informativo.

CPF tem validação de dígitos verificadores; RG recebe validação de formato, sem verificação de autenticidade. Documento normalizado é único por tipo. As funções não registram documento em mensagens de auditoria. A requisição armazena apenas documento mascarado, nome/setor no momento da entrega, nome informado de quem entregou e e-mail obtido de `auth.users` no banco. O nome digitado é declarado pelo operador; o usuário registrador e o UUID são os identificadores autenticados. Impressão tem linhas para assinatura manual, não autenticação digital.

Entrega usa a mesma transação para saldo, movimento e requisição, com idempotência incluindo recebedor e entregador. Histórico antigo e ajustes de estoque via RPC/restauração não geram requisições artificiais. O formulário de saída usa o RPC de entrega; o RPC genérico de movimentação permanece disponível para ajustes autorizados.

Testes locais: 41 verificações de banco, incluindo CPF inválido, duplicidade de documento, restrição ao leitor, entrega idempotente e falta de saldo sem requisição parcial. Conteúdo da impressão testado no navegador com usuário demonstrativo; integração real e impressora física permanecem pendentes. As oito tabelas da aplicação têm RLS após aplicar as três migrações.

## Modo demonstrativo

`?demo=1` seleciona um simulador local com usuários fictícios e senha pública de teste. O módulo é carregado dinamicamente apenas nesse modo; o cliente Supabase não é criado. Dados são mantidos na memória da aba e descartados por recarga. Sem autenticação real, MFA ou garantia de resistência à manipulação do navegador nesse simulador: destina-se somente à usabilidade, com dados fictícios. Mudar a URL para o modo demo não concede acesso a nenhuma tabela real. Migrações e políticas de produção permanecem inalteradas. Teste de navegador confirmou ausência de chamadas externas e isolamento do modo real.

## Controles implementados

- Todas as seis tabelas públicas têm RLS; nenhuma tabela concede escrita direta a anon/authenticated. Anônimos não têm leitura nem execução dos RPCs.
- Escritas passam por funções com validação no banco. Funções SECURITY DEFINER usam `search_path = ''`, nomes qualificados e autorização explícita. Os helpers estão no schema privado, fora da API pública.
- Perfil vem de tabela protegida, nunca de metadados editáveis do usuário. Administrador precisa estar ativo; operador precisa da categoria atribuída; leitor não escreve. Usuário não altera o próprio perfil.
- As funções de autorização exigem claim `aal2`. MFA obrigatório é aplicado pelo banco, não somente pela tela. Perfis próprios e vínculos próprios podem ser lidos em aal1; inventário e movimentações não.
- Saídas bloqueiam a linha do item com `FOR UPDATE`. Saldo, movimento e auditoria são gravados na mesma transação. Request UUID reduz duplicação por repetição; chave reutilizada com conteúdo diferente falha. O frontend mantém a mesma chave ao repetir uma operação após erro de rede, durante a sessão.
- Importação é atômica, sem upsert silencioso. Restauração exige administrador e gera movimentos compensatórios; UUID do lote impede execução repetida. O histórico não é apagado.
- Conteúdo do usuário renderizado com `textContent`; CSP sem scripts inline/unsafe-eval; bibliotecas locais com versões fixas. Exportação XLSX mantém textos como células de texto e não cria fórmulas/links.
- Tokens em memória, sem persistência em localStorage. O navegador não recebe credencial administrativa. Configuração exige chave publicável.

## Validação executada

30 verificações em PostgreSQL via PGlite: RLS por categoria, leitura e escrita por perfil, ausência de MFA, usuário bloqueado, anônimo, tentativa de elevar privilégio, escrita direta, saldo negativo, quantidade inválida, idempotência, rollback de lote duplicado e restauração com auditoria. PGlite é um ambiente local; não testa a configuração de rede/Auth/PostgREST nem concorrência real de múltiplas conexões.

Teste de navegador em Edge com API simulada: fluxo de login e MFA já cadastrado, conteúdo parecido com HTML tratado como texto, filtros, registro de movimento, importação de XLSX real e rejeição de fórmula, estilos de impressão e larguras 320/390/1440. O cadastro TOTP real depende do projeto Supabase.

## Antes de dados reais

1. Confirmar as duas migrações aplicadas e executar o Security Advisor do Supabase. Manter apenas `public` como schema da aplicação exposto; não expor `private`.
2. Com dois usuários reais e tokens diferentes, chamar REST/RPC diretamente: leitor não movimenta, operador não lê outra categoria, usuário sem MFA não acessa estoque, usuário bloqueado não opera. Repetir depois de alterar permissões sem renovar token.
3. Testar duas saídas simultâneas que excederiam o saldo em conjunto: uma deve falhar. O código usa bloqueio de linha, mas o teste local não verificou concorrência de rede.
4. Verificar TOTP inicial, novo login, expiração, recuperação de acesso, revogação de sessão e limites de tentativas. Recuperação de senha/fator é administrada no Supabase; não há fluxo público pronto nesta interface. Não compartilhar usuários.
5. Aplicar senhas fortes, limitar acessos ao painel Supabase/GitHub e habilitar MFA nesses serviços. Só promover administrador após conferir o UUID.
6. Revisar CSP `connect-src` para o host exato de seu projeto. Em host com cabeçalhos customizados, usar CSP por HTTP com `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` e `Permissions-Policy: camera=(), microphone=(), geolocation=()`. `frame-ancestors` não funciona por meta HTML.
7. Exercitar restauração em projeto isolado, verificar política de retenção, guardar backups com acesso restrito. Não colocar planilhas ou dumps no repositório.

## Limitações e riscos residuais

- Nenhuma revisão garante segurança absoluta. Ainda faltam teste de integração real, teste de concorrência e análise independente antes de produção.
- GitHub Pages serve arquivos estáticos e não permite controlar todos os cabeçalhos HTTP. CSP em meta protege parte da superfície; proteção contra enquadramento em iframe exige outro host ou proxy com cabeçalhos. Não apresentar esta entrega como ambiente endurecido já publicado.
- Excel é entrada não confiável. Worker + tamanho/prazo reduzem impacto, mas não oferecem isolamento rígido de memória contra arquivo comprimido malicioso. Para grande volume ou arquivos de origem não confiável, mover análise para serviço isolado com limites de CPU/memória.
- A consulta pagina até 50 mil registros e falha explicitamente acima disso. Leituras de múltiplas tabelas/páginas não constituem snapshot transacional; relatórios podem refletir alterações concorrentes. Para relatórios contábeis ou grande volume, implementar RPC paginado com snapshot e filtros no banco.
- Aplicação para uma organização. Categorias são o escopo de acesso, não isolamento entre empresas. Não usar como SaaS multiempresa sem modelar organizações e suas políticas.
- Administradores têm poder de restaurar saldos e liberar outros administradores. Auditoria não é armazenamento imutável contra o proprietário do banco. Backup externo e revisão administrativa continuam necessários.
- Exportação permite retirar dados autorizados do sistema. Downloads/impressões não são auditados no banco nesta versão. Evite dados pessoais no campo de motivo; use referência interna.
- Sem movimentações fracionadas, lotes, validade, certificado de aprovação de EPI ou assinatura de entrega. Confirmar esses requisitos antes do uso operacional.

## Referências consultadas

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Funções e privilégios](https://supabase.com/docs/guides/database/functions)
- [MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [Distribuição oficial SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/standalone/)
