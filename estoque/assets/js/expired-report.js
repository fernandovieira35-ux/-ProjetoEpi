import {expiryRows,businessDate,showDate} from './epi-expiry.js';
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(className)el.className=className;return el;};
const dateTime=value=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não informado';
export function expiredReportRows({deliveries,movements,recipients,items,categories},today=businessDate()){
 const moveMap=new Map(movements.map(m=>[m.id,m])),people=new Map(recipients.map(r=>[r.id,r])),itemMap=new Map(items.map(i=>[i.id,i])),categoryMap=new Map(categories.map(c=>[c.id,c.name]));
 return expiryRows(deliveries,today).filter(d=>d.days<=0).map(d=>{
  const m=moveMap.get(d.id),r=people.get(d.recipient_id),i=itemMap.get(m?.item_id);
  if(!m||!i)throw new Error('Dados incompletos para o relatório. Atualize os registros e tente novamente.');
  return {colaborador_id:d.recipient_id,colaborador:r?.full_name||d.recipient_name,tipo_documento:r?.document_type||'Documento na entrega',documento:r?.document_number||d.recipient_document,setor_atual:r?.sector||d.recipient_sector,cadastro_colaborador:r?.created_at||'',
   requisicao:d.id,nome_na_entrega:d.recipient_name,setor_na_entrega:d.recipient_sector,epi_id:i.id,codigo:d.item_sku,equipamento_entregue:d.item_name,categoria_atual:categoryMap.get(i.category_id)||'Não informada',quantidade:m.quantity,unidade:d.item_unit,ca_na_entrega:d.item_ca||'',prazo_meses_na_entrega:d.validity_months??'',data_entrega:d.delivered_on,data_hora_entrega:m.created_at,troca_prevista:d.due_date,dias_vencido:Math.abs(d.days),motivo:m.reason,entregue_por:d.delivered_by,registrado_por:d.actor_email,usuario_id:m.actor,
   nome_cadastro_atual:i.name,ca_cadastro_atual:i.ca||'',prazo_cadastro_atual:i.validity_months??'',unidade_cadastro_atual:i.unit,estoque_minimo_atual:i.minimum,saldo_atual:i.balance,cadastro_epi:i.created_at||''};
 }).sort((a,b)=>a.colaborador.localeCompare(b.colaborador,'pt-BR')||a.colaborador_id.localeCompare(b.colaborador_id)||a.troca_prevista.localeCompare(b.troca_prevista));
}
function fields(parent,entries){const dl=node('dl',undefined,'overdue--fields');for(const [key,value]of entries){const box=node('div');box.append(node('dt',key),node('dd',value===''||value==null?'Não informado':value));dl.append(box);}parent.append(dl);}
export async function buildExpiredReport(target,records,{demo,identity,role,today=businessDate()}){
 target.replaceChildren();const header=node('header',undefined,'overdue--header'),logo=node('img');logo.src='assets/images/transcol-logo.webp';logo.alt='Transcol Transportes e Logística';logo.width=155;logo.height=76;
 const heading=node('div');heading.append(node('p','GESTÃO DE EPIs · ACOMPANHAMENTO DE TROCAS','overdue--eyebrow'),node('h1','Relatório de EPIs vencidos'),node('p','Entregas pendentes de substituição por colaborador'));header.append(logo,heading);target.append(header);
 if(demo)target.append(node('p','DEMONSTRAÇÃO · DADOS E CAs FICTÍCIOS','overdue--demo'));
 fields(target,[['Data de referência',showDate(today)+' · Brasília'],['Emitido em',dateTime(new Date())],['Responsável pela emissão',identity],['Escopo',role==='admin'?'Todas as categorias autorizadas':'Somente categorias autorizadas a este usuário']]);
 const count=new Set(records.map(r=>r.colaborador_id)).size,summary=node('div',undefined,'overdue--summary');summary.append(node('strong',`${count} colaborador(es)`),node('strong',`${records.length} entrega(s) vencida(s)`),node('span',`Maior atraso: ${Math.max(0,...records.map(r=>r.dias_vencido))} dia(s)`));target.append(summary);
 target.append(node('p','Inclui vencimentos até a data de referência, ainda sem troca vinculada. Os dados atuais do cadastro estão identificados separadamente dos registrados na entrega.','overdue--note'));
 if(!records.length)target.append(node('p','Nenhum colaborador com EPI vencido no escopo consultado.','overdue--empty'));
 let current=null;
 for(const r of records){
  if(current!==r.colaborador_id){current=r.colaborador_id;const section=node('section',undefined,'overdue--person');section.append(node('h2',r.colaborador));fields(section,[['Documento do cadastro',`${r.tipo_documento}: ${r.documento}`],['Setor atual',r.setor_atual],['Identificador do colaborador',r.colaborador_id],['Cadastro do colaborador',dateTime(r.cadastro_colaborador)]]);target.append(section);}
  const card=node('article',undefined,'overdue--item');const title=node('div',undefined,'overdue--item-title');title.append(node('h3',`${r.codigo} · ${r.equipamento_entregue}`),node('strong',r.dias_vencido?`${r.dias_vencido} dia(s) vencido`:'Troca devida hoje'));card.append(title);
  fields(card,[['Colaborador na entrega',r.nome_na_entrega],['Setor na entrega',r.setor_na_entrega],['Entregue em',dateTime(r.data_hora_entrega)],['Troca prevista',showDate(r.troca_prevista)],['Quantidade entregue',`${r.quantidade} ${r.unidade}`],['CA na entrega',r.ca_na_entrega],['Prazo na entrega',`${r.prazo_meses_na_entrega} meses`],['Entregue por',r.entregue_por],['Motivo / referência',r.motivo],['Requisição',r.requisicao],['Registrado por',r.registrado_por],['Identificador do usuário',r.usuario_id]]);
  const details=node('div',undefined,'overdue--current');details.append(node('h4','Cadastro atual do EPI'));fields(details,[['Nome e categoria',`${r.nome_cadastro_atual} · ${r.categoria_atual}`],['CA atual / prazo atual',`${r.ca_cadastro_atual||'Não informado'} / ${r.prazo_cadastro_atual?r.prazo_cadastro_atual+' meses':'Não informado'}`],['Saldo / mínimo / unidade',`${r.saldo_atual} / ${r.estoque_minimo_atual} / ${r.unidade_cadastro_atual}`],['Cadastro do EPI',dateTime(r.cadastro_epi)],['Identificador do EPI',r.epi_id]]);card.append(details);target.append(card);
 }
 const footer=node('footer',undefined,'overdue--footer');footer.append(node('p','Transcol · Relatório de acompanhamento das trocas de EPI'),node('p','Conferido por: _____________________________________    Data: ____ / ____ / ________'));target.append(footer);
 await logo.decode();
}
