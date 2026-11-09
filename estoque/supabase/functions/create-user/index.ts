import {createClient} from 'npm:@supabase/supabase-js@2.102.0';
import {requireStrongPassword} from '../../../assets/js/password-policy.js';
import {normalizeUsername,loginEmail} from '../../../assets/js/username.js';

// Configure APP_ORIGIN com a origem exata do site (sem caminho).
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
  return reply(201,{id:data.user.id,username});
 }catch{return reply(400,{error:'Solicitação inválida ou serviço indisponível.'});}
});
