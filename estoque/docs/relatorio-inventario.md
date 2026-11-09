# Inventário e confirmação de trocas

Na página Inventário:

- **Relatório Excel com logo**: documento com logotipo incorporado, identificação da emissão, filtros, totais por unidade, cabeçalho fixo e colunas de código, equipamento, categoria, unidade, saldo, mínimo, CA, prazo de troca e situação. Respeita a busca e as categorias autorizadas.
- **Imprimir / PDF**: relatório em A4 paisagem com logo e cabeçalho da tabela repetido nas páginas. Para baixar PDF, selecione Salvar como PDF na impressão do navegador.
- **Excel de dados (restauração)**: preserva o formato original de dados para os fluxos de importação e restauração. O relatório formatado não é um backup importável.

Em Validade e trocas, **Registrar troca** prepara uma saída vinculada à entrega anterior. Após confirmar a gravação, somente essa entrega deixa de gerar alerta. Outras entregas vencidas ou próximas do vencimento continuam aparecendo, inclusive para o mesmo colaborador. A nova entrega tem seu próprio prazo de troca.

Se houver saldo insuficiente ou outra recusa ao salvar, o alerta permanece. Se a gravação for confirmada mas a atualização da consulta falhar, a mensagem informa que a movimentação foi salva: atualize os alertas sem repetir a entrega.

Validação local: testes de navegador para XLSX com imagem, integridade do pacote, impressão PDF e troca com saldo insuficiente/sucesso; arquivo XLSX aberto e convertido em PDF pelo LibreOffice. Não altera o esquema do banco; o vínculo de substituição usa a migração 006 já existente.
