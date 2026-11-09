importScripts('../vendor/xlsx.full.min.js');
self.onmessage=({data})=> {
 try {
  const book=XLSX.read(data.buffer,{type:'array',cellFormula:true,sheetRows:502});
  const dataName=data.restore?'Restauracao':'Cadastros';
  const withGuide=book.SheetNames.length===2&&book.SheetNames.includes(dataName)&&book.SheetNames.includes('Instrucoes');
  if(book.SheetNames.length!==1&&!withGuide) throw new Error('Use uma aba de dados ou o modelo oficial com '+dataName+' e Instrucoes. Remova abas extras.');
  const sheet=book.Sheets[withGuide?dataName:book.SheetNames[0]];
  for(const name of book.SheetNames)for(const [key,value] of Object.entries(book.Sheets[name])) if(!key.startsWith('!') && value.f) throw new Error('Fórmulas não são permitidas. Cole somente valores.');
  const grid=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',blankrows:false});
  const expected=['codigo','nome','categoria','unidade','minimo'];
  if(data.restore)expected.push('saldo');
  const headers=grid[0]||[];const extended=data.restore?['codigo','nome','categoria','unidade','minimo','ca','validade_meses','saldo']:['codigo','nome','categoria','unidade','minimo','ca','validade_meses'];
  if(JSON.stringify(headers)!==JSON.stringify(expected)&&JSON.stringify(headers)!==JSON.stringify(extended)) throw new Error('Cabeçalhos esperados: '+extended.join(', ')+'. O modelo antigo sem CA e prazo também é aceito.');
  self.postMessage({rows:XLSX.utils.sheet_to_json(sheet,{defval:''})});
 } catch(error) {self.postMessage({error:error.message});}
};
