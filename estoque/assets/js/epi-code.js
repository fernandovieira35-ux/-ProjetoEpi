export function formatEpiCode(number){return 'EPI-'+String(number).padStart(3,'0');}
export function codeStatus(items){let max=0n;for(const item of items){if(/^EPI-[0-9]{1,36}$/i.test(item.sku)){const n=BigInt(item.sku.slice(4));if(n>max)max=n;}}return {last_code:max?formatEpiCode(max):null,next_code:max<999999999999999999999999999999999999n?formatEpiCode(max+1n):null};}
export function normalizeManualCode(code){const value=String(code??'').trim(),match=/^EPI\s*-\s*(\d{1,36})$/i.exec(value);return match?formatEpiCode(BigInt(match[1])):value;}
export function renderCodeChoice(status){
 const manual=document.getElementById('item-code-mode').value==='manual',input=document.getElementById('item-code'),notice=document.getElementById('item-code-notice');
 input.readOnly=!manual;input.required=manual;
 if(!manual)input.value=status?.next_code||'';
 input.placeholder=manual?'Digite o código do EPI':'Gerado ao salvar';
 notice.textContent=manual?`Atenção: cadastro manual. ${status?.last_code?`Último código da sequência: ${status.last_code}.`:'Nenhum código sequencial cadastrado.'} ${status?.next_code?`Próximo sequencial: ${status.next_code}.`:''} O código informado deve ser único.`:`Código sequencial automático. ${status?.next_code?`Previsão: ${status.next_code}.`:''} O número definitivo será reservado ao salvar.`;
 notice.classList.toggle('code--manual',manual);
}
