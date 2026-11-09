// Conveniência de sessão: a confiança local NÃO substitui uma verificação AAL2.
// A sessão Supabase precisa continuar válida; ao expirar, força novo login e MFA.
const KEY='transcol-epi-mfa-session-v1';
const DAYS=30;
export function forgetMfaSession(){try{localStorage.removeItem(KEY);}catch{}}
export function rememberMfaSession(id){
 try{localStorage.setItem(KEY,JSON.stringify({id,until:Date.now()+DAYS*86400000}));}catch{}
}
export function trustedMfaSession(id){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');return value?.id===id&&Number.isFinite(value?.until)&&Date.now()<value.until;}
 catch{return false;}
}

export function expiredMfaSession(id){
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');return value?.id===id&&Number.isFinite(value?.until)&&Date.now()>=value.until;}
 catch{return false;}
}
