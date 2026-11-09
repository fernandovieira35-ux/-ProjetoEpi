import {expiryRows,businessDate,showDate} from './epi-expiry.js';
const $=id=>document.getElementById(id);
export function renderExpiry(deliveries,movements,canWrite,onReplace){
 const entries=expiryRows(deliveries),expired=entries.filter(d=>d.days<=0),soon=entries.filter(d=>d.days>0&&d.days<=30);
 const banner=$('expiry-banner');banner.hidden=!canWrite;
 const clear=expired.length+soon.length===0;
 banner.classList.toggle('expiry--clear',clear);
 $('expiry-banner-text').textContent=`Troca de EPIs: ${expired.length} entrega(s) vencida(s) e ${soon.length} a vencer nos próximos 30 dias.`;
 const missing=deliveries.filter(d=>!d.due_date&&!d.replaced_by).length;
 if(clear)$('expiry-banner-text').textContent=missing?`Nenhuma troca pendente entre as entregas com prazo. Atenção: ${missing} entrega(s) sem prazo registrado precisam de conferência.`:'Tudo certo! Nenhuma troca de EPI vencida ou prevista para os próximos 30 dias no seu acesso.';
 banner.querySelector('a').textContent=clear?'Consultar validade dos EPIs':'Consultar colaboradores e registrar trocas';
 $('expiry-summary').textContent=`${expired.length} vencidas · ${soon.length} a vencer · ${missing} sem prazo registrado. Referência: ${showDate(businessDate())} (Brasília).`;
 const filter=$('expiry-filter').value;
 const visible=entries.filter(d=>filter==='all'||(filter==='expired'?d.days<=0:d.days>0&&d.days<=30));
 const body=$('expiry-body');body.replaceChildren();
 if(!canWrite)return;
 for(const d of visible){const tr=document.createElement('tr'),m=movements.find(m=>m.id===d.id);
  for(const value of [d.recipient_name,d.recipient_sector,d.item_name,d.item_ca||'Não informado',m?.quantity??'—',showDate(d.delivered_on),`${d.validity_months} meses`,showDate(d.due_date),d.days<=0?`Vencido · ${Math.abs(d.days)} dia(s)`:`${d.status} · ${d.days} dia(s)`]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
  const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='Registrar troca';button.addEventListener('click',()=>onReplace(d,m));td.append(button);tr.append(td);body.append(tr);
 }
 if(!visible.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=10;td.textContent='Nenhuma entrega neste filtro.';tr.append(td);body.append(tr);}
}
