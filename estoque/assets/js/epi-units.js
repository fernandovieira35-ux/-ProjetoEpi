export const unitLabel=unit=>({un:'unidade(s)',par:'par(es)',caixa:'caixa(s)'})[unit]||unit;
export function suggestedUnit(name){
 const text=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/\b(luvas?|botinas?|botas?|calcados?|sapatos?)\b/.test(text))return 'par';
 if(/\b(oculos|abafadores?|protetor(?:es)? (?:auricular(?:es)?|auditivo(?:s)?|de ouvido))\b/.test(text))return 'un';
 return null;
}
export function unitGuidance(name,unit){
 const suggested=suggestedUnit(name);
 const basis=unit==='par'?'Quantidade 1 = um par completo (duas peças). Saldo e mínimo são contados em pares.':unit==='un'?'Quantidade 1 = um equipamento completo. Para protetor tipo plug, conte o conjunto para os dois ouvidos, não cada plug separadamente.':'Quantidade 1 = uma caixa inteira. O sistema não converte caixas em pares ou unidades; confira a embalagem antes de lançar.';
 return (suggested&&unit!==suggested?`Atenção: o padrão para este nome é ${unitLabel(suggested)}. Confira a unidade escolhida. `:'')+basis;
}
export function setupUnitChoice(){
 const form=document.getElementById('item-form'),select=form.elements.unidade,notice=document.createElement('p');notice.id='item-unit-notice';notice.className='code--notice';notice.setAttribute('role','status');select.setAttribute('aria-describedby',notice.id);select.closest('label').after(notice);
 const update=()=>{notice.textContent=unitGuidance(form.elements.nome.value,select.value);};
 form.elements.nome.addEventListener('input',()=>{const suggested=suggestedUnit(form.elements.nome.value);if(suggested)select.value=suggested;update();});select.addEventListener('change',update);form.addEventListener('reset',()=>queueMicrotask(update));update();
}
