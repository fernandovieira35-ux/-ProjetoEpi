# Contexto do projeto

- Ajuste de saldo/admin: migração 010 bloqueia entradas para simples, cria adjust_stock com saldo esperado e idempotência. Novos movimentos registram antes/depois, timestamp servidor e nome autenticado; ajustes aceitam estação declarada (não hostname verificado). Histórico antigo não é estimado. UI padrão Usuário simples (papel técnico operador) ou Administrador; leitor legado preservado. Simples: EPIs, colaboradores, novos imports, saídas; sem entradas/ajustes/restauração/gestão de acesso. Edge create-user deve ser republicada para dois perfis novos. Testes stock-adjustment.mjs/ui.cjs. Implantação real pendente.

- Cadastros separados em telas internas: #cadastros (EPIs/CA/prazo), #categorias (admin, criação/lista), #motivos (admin, CRUD), #recebedores e #usuarios. Menu agrupado em operação/cadastros/meu usuário; rótulos ocultos quando sem opções. Navegação sem reload, regras de perfil e impressão mantidas. Sem migração nova. Teste registration-pages.cjs cobre sessão, permissões e responsividade.

- Logotipo usa #visao e navegação interna, sem reload/session loss. Motivos têm editar/cancelar e excluir com confirmação; migração 009 exige admin/MFA, audita ações e preserva textos históricos. Demo acompanha. Testes reason-edit.mjs/reason-edit-ui.cjs. Migração remota pendente.

- Motivos cadastrados: migração 008, tabela movement_reasons com nome, orientação e ativo. Administração em Cadastro de EPIs; movimentos usam select obrigatório com aviso. Banco exige motivo ativo para novos movimentos e preserva replay/histórico. Restauração usa helper privado para motivo de sistema. Exemplos de prazo/danificação; guia docs/motivos.md. Testes reasons.mjs e reasons-ui.cjs; implantação real pendente.

- Modelo Excel revisado para LibreOffice: comentários removidos (apareciam sobrepostos); dados na primeira aba e guia em Instrucoes. Worker aceita uma aba legada ou exatamente Cadastros/Restauracao + Instrucoes; rejeita extras e fórmulas. Testes conferem valores de cada coluna e importação do modelo baixado.

- Código do EPI: padrão automático EPI-001 em diante, opção manual com aviso do maior código da sequência; normaliza EPI - 50 para EPI-050. Migração 007: contador global privado, lock por linha também em imports, cadastro RPC idempotente. Códigos existentes preservados; código definitivo ao salvar. Excel continua manual. Tests epi-code.mjs/epi-code-ui.cjs; implantação e concorrência real pendentes.

- Modelo Excel completo em import-template.js: três exemplos com categorias autorizadas, códigos novos, CA fictício, prazo e comentários; saldo só em restauração. Relatório nominal exclusivo de vencidos em expired-report.js e relatorio-vencidos.css, agrupado por colaborador, documento completo já autorizado, snapshot e cadastro atual separados, logo, PDF A4 retrato e Excel. Sempre vencidos sem substituição, independente do filtro; leitor bloqueado. Sem migração nova. Testes download/importação/PDF em expired-report.cjs.

- Alerta de validade inclui triângulo amarelo com exclamação em SVG e pulsação de opacidade de 1,8 s; texto permanece estático. Animação desativada com prefers-reduced-motion e impressão.

- CA e prazo após entrega: migração 006, módulos epi-expiry.js/expiry-view.js. Snapshots em entregas e cálculo no servidor com calendário America/Sao_Paulo. Alertas vencidos desde a data prevista, antecipação 30 dias, apenas perfis operacionais. Troca vinculada ao mesmo EPI/recebedor e quantidade integral, atômica e idempotente; registros antigos sem prazo não são recalculados. Excel suporta colunas novas e legado. Demo inclui duas botinas com datas antigas (painel executivo padrão agora tem oito entregas). Migração real pendente; guia docs/validade-ca.md.

- Visão geral: seletor de barras, colunas, pizza e rosca em `stock-chart.js`, SVG nativo e CSS separado `graficos.css`. Filtro por unidade, legenda textual, atualização manual e a cada 60 segundos na tela visível. Apenas dados autorizados já consultados; sem dependências novas. Teste `estoque/tests/stock-chart.cjs` cobre atualização, impressão, responsividade e casos vazios.

- Atualização de acesso: nomes de usuário novos via Edge Function `create-user`, migração 005, troca obrigatória marcada por padrão. Flag protegida no perfil e removida por trigger após alteração do hash no Auth. RLS/RPC bloqueiam dados antes da troca; MFA preservado. Categorias removidas do formulário; novos usuários usam todas conforme perfil, escopos antigos preservados. Demo mantém dados ao sair para testar logins novos; recarga descarta. Implantação remota pendente.

- Histórico: terminologia de apresentação padronizada para usuários/acesso, mantendo identificação por e-mail. Tela Meu acesso para trocar senha; política local de 12 caracteres e quatro classes, limite 72 bytes, senha atual e confirmação. Configuração obrigatória do Supabase Auth documentada em `docs/usuarios-e-senhas.md`, ainda não aplicada remotamente. Não confundir validação de interface com política efetiva do servidor.

- Painel executivo em seção própria (`analytics.js`, `dashboard.js`, `executivo.css`), usando apenas movimentos/requisições autorizados já consultados. Perfis operacionais; filtros próprios; atualização de 60 s na tela ativa. Excel sete abas e impressão exclusiva. Quantidades separadas por unidade, rankings por requisições, saídas sem vínculo explicitadas. Demo possui dez requisições iniciais e duas saídas sem vínculo.

- Interface organizada em telas por função (`layout.js`/`layout.css`), menu recolhível em celular, tema claro/escuro com preferência local (`theme.js`). Banners apenas antes do login. Impressão preservada com fundo claro.

- Atualização: quem entregou agora é automático (e-mail da conta conectada; UUID como alternativa), validado no banco pela migração 004. Campo somente leitura; RPC não recebe mais nome do entregador. Requisições antigas são preservadas. 42 verificações locais de banco aprovadas.

- Projeto ativo: Transcol · Gestão de EPIs, em `estoque/`. A raiz redireciona ao aplicativo. Morada foi retirado do projeto ativo a pedido do usuário; arquivos isolados em `.descarte/morada/` após bloqueio automático da exclusão definitiva.

Atualize este documento quando o projeto ganhar requisitos ou ferramentas.

## Sistema de estoque — 2026-11-08

- Aplicativo em `estoque/`, único produto ativo.
- Escopo: EPIs (interpretação de “IPIs”), categorias, entradas/saídas, relatórios, gráfico, impressão, Excel e restauração de inventário.
- HTML/CSS/JS sem build; CSS separado; Supabase JS 2.102.0 e SheetJS 0.20.3 locais. Pedido funcional substitui a antiga restrição sem JavaScript para este subprojeto.
- Supabase Auth com TOTP obrigatório e PostgreSQL/RLS por categoria; perfis admin, operador, leitor. SQL em `estoque/supabase/`.
- Configuração pública vazia, sem banco provisionado nem publicação. GitHub Pages é o destino documentado, com limitações de cabeçalhos HTTP explícitas.
- Verificação: PostgreSQL/WASM PGlite em `.tools/pglite/`, 30 verificações; navegador Edge/Playwright com API simulada e XLSX real, larguras 320/390/1440. Integração real Auth/PostgREST e concorrência pendentes.
- Guia principal `estoque/README.md`; revisão de segurança, implantação e backup em `estoque/docs/`.
- Identidade do sistema adaptada à Transcol: vermelho/grafite, logotipo e frota do site fornecido; imagem ilustrativa de motoristas com EPI gerada por IA. Recursos locais em `estoque/assets/images/`, fontes e prompt documentados no README dessa pasta.
- Tema e efeitos em `estoque/assets/css/transcol.css`: banner, cartões fotográficos, zoom por interação, entrada suave e suporte a movimento reduzido; imagens fora dos relatórios impressos.
- Modo demonstrativo explícito `?demo=1`, com adapter `assets/js/demo.js`, 12 EPIs/7 categorias/24 movimentos e três perfis fictícios. Dados apenas em memória; não chama Supabase nem cria contas reais; recarga descarta alterações. Manual de todos os campos em `estoque/docs/manual.html`.
- Recebedores de EPI separados dos logins: nome completo, RG/CPF e setor. Migração `003_recebedores.sql`, acesso operacional com MFA, documento mascarado na tela e requisição individual com recebedor, responsável informado e conta registradora automática. Demo inclui dois recebedores fictícios. 41 verificações de banco e testes de requisição no navegador aprovados localmente; migração real pendente.


- Inventário: relatório Excel com logo incorporada e impressão A4 paisagem em inventory-report.js/relatorio-inventario.css; exportação de dados original preservada para restauração. Trocas confirmadas resolvem localmente apenas a entrega substituída antes da atualização completa; falhas de consulta após salvar não devem incentivar nova gravação. Documentação em estoque/docs/relatorio-inventario.md.

- Interface: expiry-view mostra confirmação verde sem vencidos/próximos 30 dias, com ressalva para entregas sem prazo; mantém ocultação para leitor. effects.js/efeitos.css acrescentam faixa de frota local às telas internas, feedback de clique e suporte a movimento reduzido; fotos não aparecem na impressão. Teste epi-expiry-ui cobre estado verde e celular.

- Rodapé do aplicativo identifica Desenvolvimento por Fernando Vieira. Logo original FV_Win32_Classic.ico incorporada ao lado do crédito no rodapé, mantendo a marca Transcol.

- Unidades: epi-units.js sugere par para luvas/calçados e un para óculos/protetor completo conforme convenção Transcol. Seleção manual preservada, aviso de divergências na importação e explicação da quantidade na entrega. Modelo de luvas corrigido de caixa para par. Sem conversão de saldo ou bloqueio por nome no banco. Pesquisa e exceção de plug vendido em par documentadas em estoque/docs/unidades-epi.md.

- Preparação de publicação: Git local inicializado (main), workflow Pages empacota apenas index/assets/docs de estoque com configuração pública validada. scripts/bootstrap-admin.ps1/mjs cria primeiro administrador adcmim via Auth Admin + trigger005, senha criptográfica gerada somente no provisionamento, active/admin e troca obrigatória. Sem conta real ou publicação: faltam repositório remoto, projeto e autenticação. Segredos não são gravados em arquivos. Guia estoque/docs/publicacao-inicial.md.

- Projeto Supabase informado pelo usuário: tvyihitzacbzkzalkgcv. URL pública preenchida em config.js; chave publicável configurada e aceita pelo endpoint Auth (HTTP 200); origin configurado para https://github.com/fernandovieira35-aux/ProjetoEpi.git. Teste remoto com chave pública: tabela items ausente no cache (PGRST205), cadastro público habilitado. Migrações e conta real pendentes. GitHub recusou autenticação local; nenhum push realizado. Artefato dist gerado e ignorado pelo Git.
