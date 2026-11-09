import {validateEpiDetails} from './epi-expiry.js';
export function validateRows(rows,restore=false) {
 if(!Array.isArray(rows) || !rows.length || rows.length>500) throw new Error('A planilha precisa conter de 1 a 500 itens.');
 const seen=new Set();
 return rows.map((r,i)=> {
  const fail=(message)=> {throw new Error(`Linha ${i+2}: ${message}`);};
  const codigo=String(r.codigo??'').trim(), nome=String(r.nome??'').trim(), categoria=String(r.categoria??'').trim(), unidade=String(r.unidade??'').trim();
  const minimo=Number(r.minimo);
  if(!/^[A-Za-z0-9._-]{1,40}$/.test(codigo)) fail('código inválido');
  if(seen.has(codigo)) fail('código repetido'); seen.add(codigo);
  if(!nome || nome.length>120 || !categoria || categoria.length>80) fail('nome ou categoria inválidos');
  if(!['un','par','caixa'].includes(unidade)) fail('unidade deve ser un, par ou caixa');
  if(r.minimo===undefined || String(r.minimo).trim()==='' || !Number.isInteger(minimo) || minimo<0 || minimo>1000000) fail('mínimo inválido');
  const result={codigo,nome,categoria,unidade,minimo};
  const details=validateEpiDetails(r.ca,r.validade_meses);if(Object.hasOwn(r,'ca'))result.ca=details.ca??'';if(Object.hasOwn(r,'validade_meses'))result.validade_meses=details.validity_months??'';
  if(restore){const saldo=Number(r.saldo);if(r.saldo===undefined||String(r.saldo).trim()===''||!Number.isInteger(saldo)||saldo<0||saldo>1000000)fail('saldo inválido');result.saldo=saldo;}
  return result;
 });
}
