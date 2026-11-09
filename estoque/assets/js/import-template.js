export function templateRows(items,categories,restore=false){
 if(!categories.length)throw new Error('Cadastre ou solicite acesso a uma categoria antes de baixar o modelo.');
 const used=new Set(items.map(i=>i.sku));let next=1;
 return [['Bota de segurança — exemplo','par',6,'Pés'],['Capacete — exemplo','un',12,'Cabeça'],['Luvas — exemplo','par',3,'Mãos']].map(([nome,unidade,months,preferred],index)=>{
  let codigo;do{codigo=`EXEMPLO-${String(next++).padStart(3,'0')}`;}while(used.has(codigo));used.add(codigo);
  const match=categories.find(c=>c.name===preferred),category=match||categories[index%categories.length];
  const row={codigo,nome:match?nome:`EPI de exemplo — ${category.name}`,categoria:category.name,unidade,minimo:5,ca:String(90001+index),validade_meses:months};
  if(restore)row.saldo=0;return row;
 });
}
export function downloadImportTemplate(items,categories,restore){
 const rows=templateRows(items,categories,restore),book=XLSX.utils.book_new(),sheet=XLSX.utils.json_to_sheet(rows);
 const descriptions=['Código único do EPI, até 40 caracteres. Troque os códigos de exemplo pelos seus.','Nome do EPI, até 120 caracteres.','Categoria existente e autorizada. Os exemplos usam categorias disponíveis no seu acesso.','par = par completo (luvas e botinas); un = equipamento completo (óculos e protetor auditivo, incluindo os dois plugs); caixa = embalagem inteira, sem conversão automática.','Estoque mínimo inteiro, de 0 a 1000000.','Número do CA, até 10 dígitos. EXEMPLOS FICTÍCIOS: substitua por dados reais conferidos. Formate como texto para preservar zeros iniciais.','Prazo de troca após entrega: de 1 a 120 meses. Em branco: sem alerta de vencimento.','Saldo alvo inteiro de 0 a 1000000. Apenas restauração administrativa; confira antes de importar.'];
 const instructions=XLSX.utils.aoa_to_sheet([
  ['GUIA DE PREENCHIMENTO','EXEMPLOS FICTÍCIOS — revise antes de importar',''],
  ['Onde preencher',restore?'Aba Restauracao':'Aba Cadastros','Preencha somente a aba de dados; esta aba Instrucoes não será importada.'],
  ['Código do EPI','EXEMPLO-001','Na planilha o código é informado manualmente. A geração automática está no formulário do sistema.'],
  ['Campo','Exemplo','Como preencher'],
  ...Object.keys(rows[0]).map((key,index)=>[key,rows[0][key],descriptions[index]]),
  ['Importante','Não mude os cabeçalhos','Mantenha a ordem das colunas. Não insira fórmulas ou outras abas.'],
  ['Estoque inicial',restore?'Saldo alvo':'Zero',restore?'A restauração ajusta o saldo. Prefira uma exportação real para restaurar dados.':'No cadastro novo, registre uma entrada no sistema para adicionar estoque.']
 ]);
 instructions['!cols']=[{wch:24},{wch:48},{wch:115}];
 sheet['!cols']=[{wch:20},{wch:36},{wch:28},{wch:12},{wch:12},{wch:16},{wch:20},...(restore?[{wch:14}]:[])];
 for(const [key,cell]of Object.entries(sheet)){if(!key.startsWith('!')&&typeof cell.v==='string'){cell.t='s';delete cell.f;delete cell.l;}}
 XLSX.utils.book_append_sheet(book,sheet,restore?'Restauracao':'Cadastros');
 XLSX.utils.book_append_sheet(book,instructions,'Instrucoes');
 XLSX.writeFile(book,restore?'modelo-restauracao-completo.xlsx':'modelo-cadastros-completo.xlsx',{bookType:'xlsx'});
}
