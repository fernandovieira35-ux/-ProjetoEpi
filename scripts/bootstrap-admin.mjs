import {randomInt} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {requireStrongPassword} from '../estoque/assets/js/password-policy.js';
import {loginEmail} from '../estoque/assets/js/username.js';

export function generatePassword(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_+=';
 for(;;){const password=Array.from({length:24},()=>alphabet[randomInt(alphabet.length)]).join('');try{requireStrongPassword(password);return password;}catch{}}
}
export async function bootstrap({url,key,fetcher=fetch}){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url||''))throw new Error('SUPABASE_URL inválida.');
 let legacy=false;try{legacy=JSON.parse(Buffer.from((key||'').split('.')[1],'base64url')).role==='service_role';}catch{}
 if(!key||(!key.startsWith('sb_secret_')&&!legacy))throw new Error('Use SUPABASE_SECRET_KEY administrativa somente neste terminal local.');
 const headers={apikey:key,'Content-Type':'application/json'};
 if(legacy)headers.Authorization=`Bearer ${key}`;
 const request=async(route,options={})=>{let response;try{response=await fetcher(url+route,{...options,headers,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new Error('Falha de conexão. Confira o painel Auth antes de repetir; a criação pode ter sido concluída.');}if(!response.ok)throw new Error(`Supabase respondeu HTTP ${response.status}. Confira migrações, credencial e duplicidade no painel; nenhuma senha existente foi alterada.`);return response.json();};
 // Consulta também as colunas introduzidas pela migração 005 antes de criar o login.
 const admins=await request('/rest/v1/profiles?select=id,username,must_change_password,all_categories&role=eq.admin&limit=1');
 if(!Array.isArray(admins)||admins.length)throw new Error('Já existe administrador ou a consulta não é válida. Use a gestão de usuários; este script só cria o primeiro administrador.');
 const password=generatePassword(),username='adcmim';
 const user=await request('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email:loginEmail(username),password,email_confirm:true,app_metadata:{provision_access:true,username,access_role:'admin',access_active:true,must_change_password:true}})});
 const id=user.id||user.user?.id;
 if(!id)throw new Error('Auth não confirmou o identificador. Confira o painel antes de repetir.');
 try{
  const profiles=await request('/rest/v1/profiles?select=id,username,role,active,must_change_password,all_categories&id=eq.'+encodeURIComponent(id));
  const profile=profiles[0];
  if(!profile||profile.username!==username||profile.role!=='admin'||!profile.active||!profile.must_change_password||!profile.all_categories)throw new Error('Perfil não confirmado.');
 }catch{throw new Error('Auth criou o login, mas o perfil não pôde ser confirmado. Não repita a criação. Confira o trigger da migração 005 e redefina a senha pelo painel administrativo.');}
 return {username,password};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await bootstrap({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY});console.log(`Administrador ativo criado: ${result.username}\nSenha inicial (guarde em um gerenciador): ${result.password}\nTroca obrigatória no primeiro acesso e MFA. Não copie esta saída para Git, tickets ou documentos.`);}catch(error){console.error(error.message);process.exitCode=1;}
}
