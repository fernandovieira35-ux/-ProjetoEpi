import {randomInt} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {requireStrongPassword} from '../estoque/assets/js/password-policy.js';
import {loginEmail} from '../estoque/assets/js/username.js';

export function generatePassword(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_+=';
 for(;;){const password=Array.from({length:24},()=>alphabet[randomInt(alphabet.length)]).join('');try{requireStrongPassword(password);return password;}catch{}}
}
export async function bootstrap({url,key,fetcher=fetch,diagnostic=false,recover=false,newPassword,confirmation}){
 if(diagnostic&&recover)throw new Error('Escolha diagnóstico ou recuperação, não ambos.');
 if(newPassword!==undefined){if(!recover)throw new Error('Senha escolhida só é permitida na recuperação.');requireStrongPassword(newPassword);if(newPassword!==confirmation)throw new Error('As senhas digitadas não conferem. Nenhuma alteração realizada.');}
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url||''))throw new Error('SUPABASE_URL inválida.');
 let legacy=false;try{legacy=JSON.parse(Buffer.from((key||'').split('.')[1],'base64url')).role==='service_role';}catch{}
 if(!key||(!key.startsWith('sb_secret_')&&!legacy))throw new Error('Use SUPABASE_SECRET_KEY administrativa somente neste terminal local.');
 const headers={apikey:key,'Content-Type':'application/json'};
 if(legacy)headers.Authorization=`Bearer ${key}`;
 const request=async(route,options={})=>{let response;try{response=await fetcher(url+route,{...options,headers,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new Error('Falha de conexão. Confira o painel Auth antes de repetir; a criação pode ter sido concluída.');}if(!response.ok)throw new Error(`Supabase respondeu HTTP ${response.status}. Confira migrações, credencial e duplicidade no painel; consulte o diagnóstico para confirmar o estado do acesso.`);return response.json();};
 if(diagnostic||recover){
  let found=null;
  for(let page=1;page<=100;page++){
   const response=await request(`/auth/v1/admin/users?page=${page}&per_page=100`);
   const users=response.users;if(!Array.isArray(users))throw new Error('Resposta inesperada do Auth.');
   found=users.find(u=>u.email===loginEmail('adcmim'));if(found||users.length<100)break;
   if(page===100)throw new Error('Limite de consulta atingido; confira o usuário no painel.');
  }
  if(!found){if(recover)throw new Error('Login adcmim não encontrado.');return {diagnostic:true,login_exists:false};}
  const profiles=await request('/rest/v1/profiles?select=username,role,active,must_change_password,all_categories&id=eq.'+encodeURIComponent(found.id));
  const p=profiles[0],m=found.app_metadata||{};
  if(recover){
   if(found.last_sign_in_at||!p||p.username!=='adcmim'||p.role!=='admin'||!p.active||!p.all_categories||m.provision_access!==true||m.username!=='adcmim'||m.access_role!=='admin')throw new Error('Recuperação bloqueada: aplique 011 e confirme perfil ativo/admin. Este modo só atende adcmim que nunca entrou no sistema.');
   const password=newPassword??generatePassword(),id=encodeURIComponent(found.id);
   await request('/auth/v1/admin/users/'+id,{method:'PUT',body:JSON.stringify({password})});
   // A troca no Auth limpa a flag pelo trigger005; restaure a exigência antes de entregar a senha.
   try{
    const response=await fetcher(url+'/rest/v1/profiles?id=eq.'+id,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({must_change_password:true}),redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error();const updated=(await response.json())[0];
    if(updated?.username!=='adcmim'||updated.role!=='admin'||!updated.active||!updated.must_change_password)throw new Error();
   }catch{throw new Error('Senha redefinida, mas exigência de troca não confirmada. Não use o acesso; execute o diagnóstico antes de recuperar novamente.');}
   return {username:'adcmim',password,recovered:true};
  }
  return {diagnostic:true,login_exists:true,email_confirmed:!!found.email_confirmed_at,profile_exists:!!p,profile:p?{username:p.username,role:p.role,active:p.active,must_change_password:p.must_change_password,all_categories:p.all_categories}:null,provision_metadata_present:m.provision_access===true,metadata_role:m.access_role||null,metadata_requires_password_change:m.must_change_password===true};
 }
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
 }catch(error){throw new Error('Auth criou o login, mas o perfil não pôde ser confirmado. Não repita a criação. Execute bootstrap-admin.ps1 -Diagnostico. Detalhe: '+error.message);}
 return {username,password};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await bootstrap({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY,diagnostic:process.argv.includes('--diagnostic'),recover:process.argv.includes('--recover'),...(process.argv.includes('--choose-password')?{newPassword:process.env.BOOTSTRAP_NEW_PASSWORD??'',confirmation:process.env.BOOTSTRAP_CONFIRM_PASSWORD??''}:{})});if(result.diagnostic)console.log(JSON.stringify(result,null,2));else if(process.argv.includes('--choose-password'))console.log('Senha escolhida salva. Entre com adcmim e a senha que você digitou. Troca obrigatória no primeiro acesso e MFA mantidos.');else console.log(`Administrador ativo confirmado: ${result.username}\nSenha inicial (guarde em um gerenciador): ${result.password}\nTroca obrigatória no primeiro acesso e MFA. Não copie esta saída para Git, tickets ou documentos.`);}catch(error){console.error(error.message);process.exitCode=1;}
}
