# Painel executivo para a diretoria

Acesse **Painel executivo** no menu. Disponível para administrador e operador; operadores visualizam apenas categorias autorizadas. Leitores não recebem acesso adicional a nomes, setores ou requisições pessoais. Para apresentar toda a operação, use um usuário administrador autorizada.

## Filtros e atualização

- **De / Até:** período inclusivo, inicialmente os últimos 30 dias. Datas interpretadas no fuso do navegador, informado no relatório. Campos vazios removem os limites.
- **Setor:** setor registrado na entrega, não o setor atual de um cadastro alterado posteriormente.
- **Colaborador que recebeu:** pessoa que retirou os EPIs, distinta do usuário que operou o sistema. Agrupamento por identificador, não apenas nome.
- **Categoria:** categoria do equipamento dentro do escopo permitido.
- **Unidade:** limita a un, par ou caixa. Quantidades são sempre separadas por medida.
- **Atualizar dados:** consulta novamente o banco. O painel também atualiza após operações do sistema e a cada 60 segundos enquanto estiver aberto em aba visível. Não é uma conexão em tempo real. A data da consulta aparece no relatório. Falhas são sinalizadas, sem afirmar que dados antigos estão atualizados.

Filtros são independentes dos filtros do inventário e do histórico operacional.

## Indicadores e gráficos

Uma requisição representa um registro de entrega de um EPI. Não representa necessariamente uma visita do colaborador ao almoxarifado: duas linhas de entrego usuáriom duas requisições.

- **Requisições de entrega:** total de saídas com requisição e colaborador vinculados no recorte.
- **Colaboradores atendidos:** quantidade de identificadores distintos.
- **Setores atendidos:** setores presentes nas requisições filtradas.
- **Quantidades entregues:** unidades, pares e caixas separados. Não são somados como peças equivalentes.
- **Retiradas por setor / colaborador:** ranking por número de requisições, até dez resultados na visualização.
- **Evolução:** requisições por dia com entregas. Dias sem entrega não são mostrados como pontos; o gráfico não indica atividade nesses dias.
- **Equipamentos mais entregues:** ranking por requisições, não por quantidade física ou valor.
- **Usuários que registraram:** e-mail do usuário responsável; não é a pessoa que recebeu.

Os números apresentados são operacionais, sem custos financeiros. Não há preço de aquisição cadastrado nesta versão.

## Qualidade e cobertura

Saídas antigas, ajustes ou restaurações sem requisição não permitem identificar com segurança quem recebeu. Ficam fora dos rankings e são contadas em aviso próprio. Esse aviso considera o período e escopo do usuário, antes dos demais filtros. Não foram inventados vínculos em dados reais. A demonstração recebeu dez vínculos fictícios para permitir explorar os gráficos e mantém duas saídas sem vínculo para exemplificar a cobertura incompleta.

As leituras paginadas atuais têm limite de 50 mil registros por tabela e não são um snapshot transacional único. Atualize antes da apresentação; mudanças concorrentes podem ser percebidas entre consultas. Volumes maiores exigem agregação/paginação no servidor. RLS e permissões atuais continuam valendo; nenhuma migração foi adicionada para o painel.

## Relatório executivo

**Exportar executivo** atualiza a consulta e gera sete abas: Resumo, Setores, Colaboradores, Responsaveis, Equipamentos, Evolucao e Entregas. Rankings completos e todas as entregas do filtro estão no arquivo, mesmo que o gráfico mostre apenas dez. Resumo registra filtros, data de consulta, escopo, usuário emissora e identificação DEMO quando aplicável. CPF e RG não são exportados pelo relatório executivo.

**Imprimir executivo / PDF** imprime exclusivamente o painel, com indicadores, gráficos, filtros e detalhamento. Preserva identificação da demonstração e usa fundo claro mesmo no modo escuro. Pode ocupar várias páginas conforme o volume. O botão geral “Imprimir relatório” mantém seu propósito de inventário/histórico e não incorpora o executivo.

Nomes e e-mails ainda são dados pessoais: compartilhe o documento apenas com quem deve receber o relatório. A exportação não amplia as permissões do usuário que gerou o arquivo.

## Verificação local

Testes `analytics.mjs` e `executive.cjs`: agregações, limites de período, filtros combinados, homônimos, medidas separadas, sete abas do Excel, impressão exclusiva em PDF, callback periódico de 60 segundos, acesso restrito e quatro larguras de tela aprovados. A suíte operacional existente também passou. A validação foi feita com dados locais/simulados; conexão e concorrência com Supabase real continuam pendentes.
