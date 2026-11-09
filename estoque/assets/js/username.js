export function normalizeUsername(value){
 const name=String(value??'').trim().toLowerCase();
 if(!/^[a-z][a-z0-9._-]{2,39}$/.test(name))throw new Error('Use de 3 a 40 caracteres: comece com letra e use letras sem acentos, números, ponto, hífen ou sublinhado.');
 return name;
}
export function loginEmail(value){
 const name=String(value??'').trim().toLowerCase();
 // Compatibilidade com usuários existentes; novos acessos usam apenas nome.
 return name.includes('@')?name:`${normalizeUsername(name)}@usuarios.transcol.invalid`;
}
