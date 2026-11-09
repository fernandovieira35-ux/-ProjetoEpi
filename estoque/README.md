# Estoque de EPIs

## Usuários e senha forte

O menu **Usuários** cria acessos por nome e senha inicial, com troca obrigatória marcada por padrão, e administra perfis; **Meu acesso** permite alterar a própria senha. A interface exige mínimo de 12 caracteres, maiúscula, minúscula, número e símbolo. Confira a [política e configuração no Supabase](docs/usuarios-e-senhas.md): os requisitos do Auth e a verificação da senha atual ainda precisam ser ativados no projeto real para garantir a regra também pela API.

## Testar agora, sem configurar Supabase

Abra `estoque/index.html` pelo Live Server e clique em **Experimentar com dados fictícios**, ou acrescente `?demo=1` ao endereço. A demonstração contém 12 EPIs, 7 categorias e 24 movimentações, com dados somente em memória e nenhuma chamada ao Supabase. Recarregar ou sair restaura a carga inicial.

Acesse com `admin@demo.local`, `operador@demo.local` ou `leitor@demo.local`. Senha pública exclusiva do simulador: `DemoEpi2026!`. Não são usuários reais nem credenciais para produção. O modo real continua exigindo Supabase Auth e MFA.

O [manual de uso e campos](docs/manual.html) explica todos os campos, permissões, Excel, relatórios e um roteiro de teste. Ele abre pelo link da tela e pode ser salvo em PDF pelo navegador.

Aplicação web de gestão de EPIs da Transcol. HTML semântico, CSS separado e módulos JavaScript sem build. Preparada para GitHub Pages + Supabase. Não está publicada nem conectada a um banco real.

## Estrutura

```text
estoque/
  index.html
  assets/
    css/         variables, global, componentes, painel, impressao
    js/          configuração, API, aplicação, validação, worker Excel
    vendor/      Supabase JS e SheetJS fixados e servidos localmente
  supabase/      migrações SQL ordenadas
  docs/          segurança, implantação e backup
  tests/         banco PostgreSQL local e navegador
```

## Configuração inicial

Siga o [guia de publicação e primeiro administrador](docs/publicacao-inicial.md).
Aplique as migrações **001 a 010**, configure a política de senha/MFA e execute o provisionamento local do primeiro administrador `adcmim`. O script gera a senha forte durante a criação e exige troca no primeiro acesso. Nunca insira chave administrativa ou senha no frontend.

O workflow GitHub Pages utiliza somente `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` públicas. A criação real do administrador e a publicação dependem da conexão com os serviços; preparar os arquivos não cria a conta.

## Perfis

| Operação | Administrador | Operador | Leitor |
| --- | --- | --- | --- |
| Consultar, imprimir, exportar | Todas as categorias | Categorias atribuídas | Categorias atribuídas |
| Cadastrar EPI, importar novos, movimentar | Sim | Categorias atribuídas | Não |
| Criar categoria / alterar acessos | Sim | Não | Não |
| Restaurar saldos por Excel | Sim | Não | Não |

Alterar seu próprio perfil é bloqueado. Usuários bloqueados perdem acesso às operações seguintes mesmo com JWT válido. Dados já vistos ou exportados não podem ser recolhidos. Por política de segurança não há exclusão de movimentos; corrija com movimento compensatório e motivo.

## Recursos

- **Painel executivo:** indicadores de entregas, filtros por período/setor/colaborador/categoria/unidade, rankings e evolução diária. Atualização manual e a cada minuto enquanto o painel está aberto. Relatório exclusivo em PDF e Excel com sete abas. Veja [como interpretar os números](docs/painel-executivo.md).

- Navegação por telas: visão geral, inventário, entregas/histórico, cadastro de EPIs, colaboradores, importação e acessos. Apenas uma seção operacional fica visível por vez; os formulários preservam o preenchimento ao alternar telas.
- Layout adaptado para celular e tablet: botão **Menu**, controles de toque e tabelas com rolagem horizontal própria. Use **Modo escuro / Modo claro** no topo; a preferência fica salva neste navegador. As impressões permanecem claras.

Requisição individual formatada em A4 retrato com logo Transcol, identificação do colaborador, tabela do equipamento, motivo, linhas de observações e duas assinaturas com datas. Para remover URL/data/título automáticos nas margens, desmarque **Cabeçalhos e rodapés** nas opções de impressão do navegador. O relatório geral continua em paisagem. PDF de exemplo conferido em uma página; textos extensos podem ocupar mais páginas.

- Inventário por categoria, busca por nome/código e alerta de estoque mínimo.
- Cadastro de colaboradores recebedores, com nome completo, CPF ou RG e setor. Não cria login. Administradores e operadores com categorias atribuídas podem consultar/cadastrar; leitores não acessam documentos ou requisições pessoais.
- Saídas pela tela exigem colaborador e identificação automática de quem entrega. Na linha do histórico, **Imprimir requisição** gera comprovante individual com recebedor, setor, documento mascarado, EPI, quantidade, responsável autenticado e usuário registrador obtida pelo banco. Dados da entrega são preservados como estavam naquele momento. Há linhas para assinatura manual, sem assinatura digital.
- Entradas e saídas inteiras, saldo não negativo, autoria e trilha de auditoria no banco.
- Gráfico acessível por categoria, histórico com período e exportação XLSX.
- Impressão pela caixa padrão do navegador; selecione a impressora instalada ou Salvar como PDF. Não há impressão silenciosa nem integração proprietária com impressoras de etiquetas.
- Excel `.xlsx`: até 2 MB e 500 registros, uma aba, cabeçalhos exatos, sem fórmulas. Processamento em worker, prazo de dez segundos e prévia antes de confirmar.
- Restauração de inventário pelo administrador, preservando histórico e itens ausentes. Veja [backup](docs/backup.md).

## Verificação

No ambiente atual, Node portátil, Playwright/Edge e PGlite ficam em `.tools/` (ignorados pelo Git):

```powershell
./.tools/node.exe estoque/tests/database.mjs
./.tools/node.exe estoque/tests/browser.cjs
./.tools/node.exe estoque/tests/demo.cjs
./.tools/node.exe estoque/tests/analytics.mjs
./.tools/node.exe estoque/tests/executive.cjs
./.tools/node.exe estoque/tests/password-policy.mjs
./.tools/node.exe estoque/tests/password-ui.cjs
```

Banco: 42 verificações executadas em PostgreSQL/WASM, com papéis e claims Auth simulados, incluindo recebedores, documentos repetidos/CPF inválido, requisição, idempotência e bloqueio de leitura por leitores. Navegador: a API é simulada para testar interface e arquivos XLSX reais. O modo demo também valida o conteúdo da requisição e a limpeza após imprimir. Não equivale a testar Supabase Auth/PostgREST em produção. Antes de publicar com dados reais, execute os cenários de [segurança](docs/seguranca.md) no seu projeto.

Demonstração: teste executado com o adapter real do simulador, validando carga, três perfis, saída, saldo insuficiente, rollback de importação, restauração, reinício por recarga, identificação na impressão, manual e 320/390/1440 px. Confirmadas zero chamadas externas; modo real continua separado e bloqueado enquanto não configurado.

Para reproduzir em outra máquina, instale Node, disponibilize Playwright e Edge e o pacote `@electric-sql/pglite`, ajustando os caminhos nos testes. São ferramentas de teste, não dependências de produção.

Veja [implantação](docs/implantacao.md) e [revisão de segurança](docs/seguranca.md).
# Gráficos da Visão geral

Em **Estoque por categoria**, escolha barras horizontais, colunas, pizza ou rosca. O filtro **Unidade do estoque** permite comparar unidades, pares ou caixas separadamente; “Todas” soma as quantidades e sinaliza essa mistura. Pizza, rosca e colunas incluem legenda com valores e participação percentual.

Use **Atualizar gráfico** para consultar os dados atuais. A atualização também acontece após movimentações e automaticamente a cada 60 segundos enquanto a Visão geral está aberta e a aba visível. Tipo e filtro são mantidos durante essas atualizações. A impressão inclui o gráfico selecionado. As permissões existentes continuam aplicadas.

Verificação local: `.tools/node.exe estoque/tests/stock-chart.cjs`.


## Validade de uso e CA

Cadastro de CA e prazo de troca em meses, inclusive para itens existentes; alertas por colaborador em **Validade e trocas**, antecipação de 30 dias e substituição vinculada à nova entrega. Aplique a migração **006_validade_ca.sql** após 001–005. Consulte [guia de validade e CA](docs/validade-ca.md). Migração real ainda não aplicada.

## Modelo completo e relatório de vencidos

Importação Excel oferece planilha com três exemplos, sete campos e instruções em aba separada (oito no modo restauração). Em Validade e trocas, use **Relatório de vencidos / PDF** ou **Exportar vencidos em Excel**: documento com logo, dados completos do colaborador, cadastro e entrega, limitado ao escopo autorizado. [Guia](docs/modelo-e-relatorio-vencidos.md). Teste: `.tools/node.exe estoque/tests/expired-report.cjs`.

## Código sequencial de EPI

Cadastro usa sequência automática EPI-001 em diante por padrão, com opção manual e aviso do último número da sequência. Código definitivo reservado pelo banco; Excel/manual também atualizam o contador. Aplique **007_codigo_sequencial.sql** após 001–006. [Guia](docs/codigo-epi.md). Implantação remota pendente.

## Motivos cadastrados

Administradores gerenciam motivos e avisos em Cadastros → Motivos / referências. Movimentações exigem seleção de motivo ativo. Exemplos iniciais incluem troca por prazo de uso e danificação. Aplique **008_motivos.sql** após 001–007. [Guia](docs/motivos.md). Implantação remota pendente.

## Navegação e manutenção de motivos

O logotipo volta à Visão geral sem recarregar ou encerrar sessão. Administradores podem editar e excluir motivos, preservando o texto histórico. Aplique **009_editar_excluir_motivos.sql** após 008 para as novas ações no Supabase real. Testes: `reason-edit.mjs` e `reason-edit-ui.cjs`.

## Telas de cadastro

Menu organizado em Operação, Cadastros e Meu usuário. Cadastros possui telas próprias para EPIs, categorias, motivos/referências, colaboradores e usuários, conforme o perfil. Apenas uma tela aparece por vez e a sessão permanece conectada. Nenhuma migração adicional é necessária para esta reorganização.

## Ajustes administrativos e usuário simples

Ajuste de saldo e entradas são exclusivos do administrador. Novos acessos oferecem Administrador ou Usuário simples (padrão). Simples cadastra EPIs/colaboradores, importa novos itens sem saldo e registra entregas; não ajusta ou restaura saldo nem gerencia acessos. Histórico e Excel mostram antes/depois, data/hora, usuário e estação declarada quando informada. Aplique **010_ajuste_saldo.sql** após 009 e republique **create-user**. [Guia completo](docs/ajuste-saldo-perfis.md). Implantação real pendente.
