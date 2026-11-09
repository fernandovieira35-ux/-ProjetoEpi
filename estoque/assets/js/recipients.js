export function validateRecipient(v){
 const full_name=v.name.trim(),sector=v.sector.trim(),document_type=v.document_type;
 const document_number=v.document.replace(/[. /-]/g,'').toUpperCase();
 if(full_name.length<3||full_name.length>120||sector.length<2||sector.length>80)throw new Error('Confira nome completo e setor.');
 if(!['RG','CPF'].includes(document_type)||! /^[A-Z0-9]{5,20}$/.test(document_number))throw new Error('Documento inválido.');
 if(document_type==='CPF'){
  if(!/^\d{11}$/.test(document_number)||/^(\d)\1{10}$/.test(document_number))throw new Error('CPF inválido.');
  for(let pos=9;pos<=10;pos++){let sum=0;for(let i=0;i<pos;i++)sum+=Number(document_number[i])*(pos+1-i);if((sum*10%11)%10!==Number(document_number[pos]))throw new Error('CPF inválido.');}
 }
 return {full_name,sector,document_type,document_number};
}
export const maskedDocument=r=>`${r.document_type} ••••${r.document_number.slice(-4)}`;
