export function validateEpiDetails(ca,months){
 const number=String(ca??'').trim(),value=String(months??'').trim();
 if(number&&!/^\d{1,10}$/.test(number))throw new Error('CA deve conter de 1 a 10 dígitos.');
 if(value&&(!/^\d+$/.test(value)||Number(value)<1||Number(value)>120))throw new Error('Prazo de troca deve ser de 1 a 120 meses, ou ficar em branco.');
 return {ca:number||null,validity_months:value?Number(value):null};
}
export function businessDate(value=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const get=type=>parts.find(p=>p.type===type).value;return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addMonths(date,months){
 const [y,m,d]=date.split('-').map(Number),target=new Date(Date.UTC(y,m-1+months,1));
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(d,last));return target.toISOString().slice(0,10);
}
export const showDate=date=>date?date.split('-').reverse().join('/'):'Não informado';
export function expiryRows(deliveries,today=businessDate()){
 return deliveries.filter(d=>d.due_date&&!d.replaced_by).map(d=>{const days=Math.round((Date.parse(d.due_date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);return {...d,days,status:days<=0?'Vencido':days<=30?'Vence em até 30 dias':'No prazo'};}).sort((a,b)=>a.due_date.localeCompare(b.due_date)||a.recipient_name.localeCompare(b.recipient_name));
}
