import {showDate} from './epi-expiry.js';
// Conteúdo inserido como texto, inclusive nomes e observações vindos do banco.
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
export async function buildReceipt(sheet,m,d,demo){
 sheet.replaceChildren();
 const header=element('header',undefined,'receipt--header');
 const logo=element('img');logo.src='assets/images/transcol-logo.webp';logo.alt='Transcol Transportes e Logística';logo.width=155;logo.height=76;
 const title=element('div');title.append(element('p','TRANSCOL · CONTROLE DE EQUIPAMENTOS','receipt--eyebrow'),element('h1','Requisição de entrega de EPI'),element('p','Comprovante individual de entrega','receipt--subtitle'));header.append(logo,title);sheet.append(header);
 if(demo)sheet.append(element('p','DEMONSTRAÇÃO · DADOS FICTÍCIOS · SEM VALIDADE OPERACIONAL','receipt--demo'));
 function fields(parent,entries){const list=element('dl',undefined,'receipt--fields');for(const [label,value]of entries){const group=element('div');group.append(element('dt',label),element('dd',value));list.append(group);}parent.append(list);}
 function section(number,title){const node=element('section',undefined,'receipt--section');node.append(element('h2',`${number}  ${title}`));sheet.append(node);return node;}
 fields(sheet,[['Número da requisição',m.id],['Data e hora da entrega',new Date(m.created_at).toLocaleString('pt-BR')]]);
 const recipient=section('01','Identificação do colaborador');
 fields(recipient,[['Nome completo',d.recipient_name],['Setor',d.recipient_sector],['Documento (parcialmente oculto)',d.recipient_document],['Tipo de operação','Saída · Entrega de EPI']]);
 const equipment=section('02','Equipamento entregue');const table=element('table',undefined,'receipt--table');const head=element('thead'),tr=element('tr');for(const label of ['Código','Descrição do EPI','Quantidade','Unidade']){const th=element('th',label);th.scope='col';tr.append(th);}head.append(tr);const body=element('tbody'),row=element('tr');for(const value of [d.item_sku,d.item_name,String(m.quantity),({un:'Unidade',par:'Par',caixa:'Caixa'})[d.item_unit]||d.item_unit])row.append(element('td',value));body.append(row);table.append(head,body);equipment.append(table);fields(equipment,[['CA',d.item_ca||'Não informado'],['Prazo de troca',d.validity_months?d.validity_months+' meses':'Não informado'],['Troca prevista',showDate(d.due_date)]]);
 const reason=section('03','Motivo / referência');reason.append(element('p',m.reason,'receipt--reason'));
 const confirmation=section('04','Conferência e observações');confirmation.append(element('p','Ao assinar, confirmo o recebimento do equipamento e da quantidade discriminados nesta requisição. Confira os dados antes da assinatura.'));confirmation.append(element('p','Observações no ato da entrega:','receipt--notes-label'));for(let i=0;i<2;i++)confirmation.append(element('div',undefined,'receipt--ruled-line'));
 const signatures=section('05','Assinaturas');const grid=element('div',undefined,'receipt--signature-grid');
 for(const [label,name]of [['COLABORADOR QUE RECEBEU',d.recipient_name],['RESPONSÁVEL PELA ENTREGA',d.delivered_by]]){const box=element('div',undefined,'receipt--signature');box.append(element('div',undefined,'receipt--signature-line'),element('strong',label),element('p',name),element('p','Data: ______ / ______ / __________','receipt--signature-date'));grid.append(box);}signatures.append(grid);
 const footer=element('footer',undefined,'receipt--audit');footer.append(element('strong','Rastreabilidade do registro'));fields(footer,[['Usuário que registrou',d.actor_email],['Identificador do usuário',m.actor]]);footer.append(element('p','Documento emitido pelo sistema de gestão de EPIs da Transcol. Campos de assinatura destinados ao preenchimento manual.'));sheet.append(footer);
 // Garante o carregamento do logotipo antes de abrir a impressão.
 await logo.decode();
}
