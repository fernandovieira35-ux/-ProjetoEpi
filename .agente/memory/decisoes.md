# Decisões

## Usuários e política de senha

- Interpretar “contas para usuários” como nomenclatura de acesso individual. Manter e-mail como identificador e não enfraquecer MFA/RLS.
- Validar senha no login e troca: 12 caracteres, maiúscula/minúscula/número/símbolo, até 72 bytes. Usuários legados com senha fraca precisam redefinição administrativa.
- Nova tela Meu acesso envia senha atual e nova ao Auth. Exigência real de força e verificação da senha atual depende das opções do servidor Supabase; não há projeto remoto conectado. Exemplo TOML e guia não constituem configuração aplicada.
- Demonstração simula troca apenas em memória. Não registrar senhas reais em documentação, histórico ou logs.

## Indicadores para diretoria

- Agrupar colaboradores pelo UUID e setores pelo texto preservado na entrega. Separar recebedor da conta registradora. Sem CPF/RG no relatório executivo.
- Contar requisições como registros, não visitas ou pessoas. Unidades/pares/caixas separados; não inferir custos. Top dez apenas nos gráficos; planilha e tabela contêm os dados filtrados completos.
- Não atribuir pessoas/setores a saídas históricas sem requisição. Sinalizar cobertura incompleta. Vínculos criados na carga demo são exclusivamente fictícios.
- Manter RLS atual: administrador vê todas as categorias; operador tem escopo parcial; leitor não ganha acesso a requisições pessoais. Atualização periódica somente enquanto a tela está ativa; sem promessa de snapshot contábil ou tempo real.

## Aviso de estoque na seleção de EPI

- Ao selecionar equipamento em movimentações, mostrar aviso persistente quando saldo <= mínimo; saldo zero recebe texto de estoque esgotado. Exibir nome/código, saldo, unidade e mínimo.
- Recalcular após carregar dados; remover ao escolher item com saldo normal ou limpar seleção. Região acessível de status, sem popup bloqueante; cores para temas claro/escuro. Usa o último saldo carregado, sem substituir a validação transacional do banco.

## Organização da interface e temas

- Mostrar uma seção operacional por vez, com navegação por fragmento de URL e indicação da tela atual. Permissões continuam aplicadas pela lógica existente e banco; rotas não autorizadas retornam à visão geral.
- Banners institucionais ficam na apresentação antes do login. Menu recolhível até 760 px, formulários em uma coluna no celular e tabelas com rolagem própria.
- Tema claro/escuro com preferência local `transcol-theme`; na primeira visita segue a preferência do sistema. Apenas tema é persistido, não credenciais. Impressão permanece clara e inclui as seções de relatório, mesmo quando inativas na tela.
- Suítes de navegador e demo aprovadas; navegação por sete telas em 320/390/768/1024/1440 px, tema escuro em 390/768/1440 px, persistência após recarga e ausência de transbordamento da página verificados.

## Formulário impresso de entrega

- Requisição individual em A4 retrato, com logotipo local, seções numeradas, tabela de EPI, observações pautadas e assinaturas separadas do colaborador e responsável. Relatórios gerais permanecem em paisagem.
- Construção segura com textContent no módulo `receipt.js`; aguarda decodificação do logotipo antes de imprimir. Dados pessoais continuam parcialmente ocultos e entregador automático preservado.
- Verificação: suíte demo aprovada; PDF demonstrativo em uma página, logotipo carregado e duas áreas de assinatura conferidos no Edge. Cabeçalhos/rodapés automáticos do navegador são controlados pelo diálogo de impressão.

## Entregador automático

- Substituir nome declarado de quem entrega pela conta autenticada, conforme pedido. Campo somente leitura exibe e-mail; banco deriva identidade de auth.uid()/auth.users, sem aceitar parâmetro do cliente.
- Migração 004 remove a assinatura antiga do RPC para impedir envio de nome arbitrário. Histórico anterior preservado; novas requisições usam e-mail (ou UUID se não disponível). Demo segue a mesma regra.

## Cadastro de recebedores e requisição de EPI

- Separar colaboradores recebedores das contas de login. RG ou CPF único por tipo, setor textual; CPF com dígitos verificadores, RG apenas formato.
- Administradores/operadores autorizados compartilham cadastro de colaboradores; leitores não recebem dados pessoais dessa tabela. Categoria continua limitando acesso à requisição.
- Entrega preserva nome/setor/documento mascarado do recebedor e nome declarado de quem entregou; conta registradora obtida no banco, nunca enviada pelo cliente. Requisição individual disponível no histórico para reimpressão, com campos de assinatura manual.
- Migração incremental 003 preserva movimentos antigos; ajustes/restaurações não inventam recebedores. Atualizar o banco antes de usar a versão nova no modo real.

## Demonstração para teste de usabilidade

- Carga fictícia e acesso padrão ficam em simulador explícito `?demo=1`, sem modificar migrações, credenciais ou políticas do Supabase. Não foi criada conta administrativa real padrão.
- Adapter carregado somente no modo demo; dados descartados ao sair/recarregar. Três perfis permitem testar visibilidade e fluxos; não representam controle de segurança contra manipulação do navegador.
- Faixa de demonstração persistente e marcação na impressão. Manual HTML acessível pela tela, com todos os campos e impressão em PDF; “dln” foi interpretado como pedido de documentação de uso.

## Frota Transcol — ajuste das imagens

- Banner usa foto original do pátio com caminhões e logotipos do site. Foto da rodovia preservada.
- Cena de motoristas com EPI editada com imagegen para incluir caminhão com identidade Transcol; identificada como composição ilustrativa, não foto de veículo real. Arquivo anterior preservado sem uso na interface.
- Cartão de motoristas exibe imagem completa para não cortar os logotipos. Fontes e prompt em `estoque/assets/images/README.md`.

## 2026-11-08 — Identidade Transcol

- Aplicar referência visual fornecida pelo usuário apenas ao sistema `estoque/`, preservando Morada.
- Usar vermelho #C8202F e grafite do site Transcol, logo/foto institucional locais e cena de motoristas com EPI gerada com imagegen, identificada como ilustrativa.
- Efeitos CSS finitos e por interação; respeitar movimento reduzido, não usar slideshow automático ou carregar scripts do site externo. Autenticação, RLS e dados não foram modificados.

## 2026-11-08 — Estoque de EPIs

- Preservar os arquivos Morada e isolar o sistema em `estoque/`.
- JavaScript é necessário para autenticação, importação e integração; nenhuma ferramenta de build ou framework foi adicionada.
- Autorização efetiva no banco com RLS e RPCs, escrita direta revogada, MFA aal2, categorias atribuídas e perfis protegidos. Tokens somente em memória.
- Planilha de cadastro não é backup completo. Restauração Excel reconcilia apenas saldos e cria movimentos compensatórios; backup integral exige procedimento Supabase/PostgreSQL.
- Não publicar sem projeto/repositório de destino identificado. Configuração e teste reais continuam pendentes; não confundir testes locais com auditoria de produção.

## Visualização local — porta do Live Server

- Porta 5500 conflita com Oracle XML DB neste ambiente: HTTP retorna resposta vazia.
- Configuração do workspace em `.vscode/settings.json` usa 127.0.0.1:5501.
- Servidor iniciado localmente com o pacote Live Server já instalado, via `.tools/visualizar.cjs`; index e imóvel responderam HTTP 200.
- O processo auxiliar pode ocupar 5501 enquanto estiver ativo; pare esse processo antes de iniciar outra instância na mesma porta pelo VS Code.

## 2026-09-21 — Estrutura inicial

- Usar `.agente/` como diretório documental solicitado pelo usuário.
- Centralizar orientações comuns em `AGENTS.md`.
- Referenciar as mesmas orientações a partir de `GEMINI.md` e `CLAUDE.md`.
- Manter a base sem dependências enquanto o projeto usa HTML e CSS simples.

## 2026-09-28 — Morada

- Implementar a sequência de pedidos porque a pasta continha apenas o harness.
- Manter skills e regras em `.agent/`, caminho legado oficialmente compatível com Antigravity e gravável neste ambiente. Não armazenar skills em `GEMINI.md`.
- Separar CSS agnóstico e tokens em `projeto/`, estilos específicos em `paginas/`.
- Usar HTML/CSS apenas: carrossel com âncoras e scroll-snap, informações adicionais com details/summary, mapa desenhado em CSS.
- A marca Morada, as medidas, os dados e a paleta verde são decisões do protótipo; não são tokens oficiais do Airbnb.
- Fotos externas Unsplash dependem de conexão. Imagens ilustram ambientes diferentes.
- Playwright local serve exclusivamente à validação; não há JavaScript entregue ao navegador da interface.

## 2026-09-28 — Refinamento pela referência Airbnb

- Substituir o banner alto por introdução compacta e navegação segmentada central, priorizando a descoberta dos imóveis.
- Usar filtros funcionais de rádio e CSS `:has()` para casas/apartamentos; exige navegador moderno. Sem JavaScript na página.
- Manter cores verdes e conteúdo imobiliário; não copiar a marca ou inventar avaliações de hóspedes.
- Galeria permanece com scroll-snap e recebe miniaturas acessíveis.

# Criação de acesso por usuário

- Novo cadastro usa nome de usuário e senha inicial forte; checkbox de troca obrigatória marcado por padrão. Perfil e situação mantidos. Categorias retiradas do formulário; novos perfis usam todas as categorias, sem alterar escopos antigos.
- Criação real usa Edge Function administrativa e gatilho de provisionamento atômico. Migração 005 bloqueia acesso operacional antes da troca; flag somente é liberada pelo gatilho de alteração de senha no Auth. MFA mantido.
- Nome é convertido para identificador técnico de Auth; e-mails antigos continuam aceitos. Recuperação de novos nomes depende de administrador, sem caixa postal.
- Demo preserva dados ao sair para permitir testes entre usuários criados; recarregar descarta. Integração remota de Auth/Edge ainda pendente. Testes locais em first-access.mjs e first-access-ui.cjs.

# Validade de EPI e CA

- Prazo de troca em meses após entrega, opcional, separado do número de CA. Sem prazo, não presumir vencimento. Valores informados pelo responsável; sem validação externa do CA.
- Migração 006 guarda snapshots e calcula data no servidor em America/Sao_Paulo, com ajuste ao último dia do mês. Alterações de cadastro só valem para novas entregas.
- Alertas vencidos e até 30 dias antes; dados pessoais restritos aos perfis operacionais. Atualização com app aberto e visível, sem push/e-mail.
- Substituição integral vinculada à nova saída, mesmo EPI e colaborador, transação com locks e idempotência. Histórico preservado. Excel novo e legado aceitos; divergências na restauração abortam.
- Testes locais de banco, UI/Excel e regressões passaram; migração e integração real no Supabase pendentes. Guia em estoque/docs/validade-ca.md.


## Descarte do Morada

Morada retirado do projeto ativo por solicitação do usuário. Arquivos exclusivos isolados em .descarte/morada, ignorada pelo Git, após bloqueio automático da exclusão definitiva. Raiz encaminha ao estoque. Decisões antigas de preservar Morada estão revogadas.
