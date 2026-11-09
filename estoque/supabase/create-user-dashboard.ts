// Gerado por scripts/prepare-create-user.mjs. Cole este arquivo inteiro no editor da Edge Function create-user.
import {createClient} from 'npm:@supabase/supabase-js@2.102.0';

// Configure APP_ORIGIN com a origem exata do site (sem caminho).
function passwordChecks(value){return [
 ['Pelo menos 12 caracteres',Array.from(value).length>=12],
 ['Uma letra maiúscula (A–Z)',/[A-Z]/.test(value)],
 ['Uma letra minúscula (a–z)',/[a-z]/.test(value)],
 ['Um número (0–9)',/[0-9]/.test(value)],
 ['Um símbolo, como ! @ # $ %',/[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(value)],
 ['Até 72 bytes (letras acentuadas podem ocupar mais de um)',new TextEncoder().encode(value).length<=72]
 ];}
function requireStrongPassword(value){if(typeof value!=='string'||passwordChecks(value).some(([,ok])=>!ok))throw new Error('A senha deve ter pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo, até 72 bytes. Se sua senha antiga não atende, solicite a redefinição ao administrador.');}

function normalizeUsername(value){
 const name=String(value??'').trim().toLowerCase();
 if(!/^[a-z][a-z0-9._-]{2,39}$/.test(name))throw new Error('Use de 3 a 40 caracteres: comece com letra e use letras sem acentos, números, ponto, hífen ou sublinhado.');
 return name;
}
function loginEmail(value){
 const name=String(value??'').trim().toLowerCase();
 // Compatibilidade com usuários existentes; novos acessos usam apenas nome.
 return name.includes('@')?name:`${normalizeUsername(name)}@usuarios.transcol.invalid`;
}

Deno.serve(async req=>{
 const origin=Deno.env.get('APP_ORIGIN');
 const headers={'Access-Control-Allow-Origin':origin||'null','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(status:number,message:unknown)=>new Response(JSON.stringify(message),{status,headers});
 if(!origin||req.headers.get('origin')!==origin)return reply(403,{error:'Origem não autorizada.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Método inválido.'});
 try{
  const authorization=req.headers.get('authorization')||'';
  const url=Deno.env.get('SUPABASE_URL')!;
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await caller.auth.getUser();
  if(authError||!user)return reply(401,{error:'Sessão inválida.'});
  const {data:allowed,error:permissionError}=await caller.rpc('can_manage_users');
  if(permissionError||allowed!==true)return reply(403,{error:'Administrador ativo com MFA e senha atualizada necessário.'});
  const raw=await req.text();if(new TextEncoder().encode(raw).length>4096)return reply(413,{error:'Solicitação muito grande.'});
  const body=JSON.parse(raw);
  const username=normalizeUsername(body.username);requireStrongPassword(body.password);
  if(!['admin','operador'].includes(body.role)||typeof body.active!=='boolean'||typeof body.must_change_password!=='boolean')return reply(400,{error:'Parâmetros inválidos.'});
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.admin.createUser({email:loginEmail(username),password:body.password,email_confirm:true,app_metadata:{provision_access:true,username,access_role:body.role,access_active:body.active,must_change_password:body.must_change_password}});
  if(error)return reply(400,{error:'Não foi possível criar o usuário. Verifique duplicidade, política de senha e implantação.'});
  const {data:profile,error:profileError}=await admin.from('profiles').select('username,role,active,must_change_password,all_categories').eq('id',data.user.id).single();
  if(profileError||!profile||profile.username!==username||profile.role!==body.role||profile.active!==body.active||profile.must_change_password!==body.must_change_password||!profile.all_categories)return reply(409,{code:'PROFILE_NOT_READY',error:'Login criado, mas perfil não confirmado. Confira a migração 011; não repita a criação.'});
  return reply(201,{id:data.user.id,username});
 }catch{return reply(400,{error:'Solicitação inválida ou serviço indisponível.'});}
});
