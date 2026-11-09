import {PGlite} from '../../.tools/pglite/package/dist/index.js';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeUsername,loginEmail} from '../assets/js/username.js';
assert.equal(normalizeUsername('  Joao.Silva '),'joao.silva');
for(const name of ['ab','a b','ábc','x@y.com','1abc'])assert.throws(()=>normalizeUsername(name));
assert.equal(loginEmail('Joao.Silva'),'joao.silva@usuarios.transcol.invalid');
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,email text,encrypted_password text,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
grant usage on schema auth to authenticated; grant execute on all functions in schema auth to authenticated;`);
for(const file of ['001_estoque','002_restauracao_excel','003_recebedores','004_entregador_automatico','005_usuarios_primeiro_acesso','006_validade_ca','007_codigo_sequencial','008_motivos','009_editar_excluir_motivos'])await db.exec(readFileSync(new URL('../supabase/'+file+'.sql',import.meta.url),'utf8'));




const admin='00000000-0000-4000-8000-000000000001',operator='00000000-0000-4000-8000-000000000002';await db.exec(`insert into auth.users(id) values('${admin}'),('${operator}');insert into public.profiles(id,role) values('${admin}','admin'),('${operator}','operador');`);
async function as(id,aal='aal2'){await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claim.aal='${aal}';set role authenticated;`);}async function scalar(sql){return Object.values((await db.query(sql)).rows[0])[0];}
await as(admin);const reason=await scalar("select public.create_reason('Motivo original','Aviso original')");await db.exec(`select public.create_category('Mãos');select public.import_items('[{"codigo":"TESTE","nome":"Luva teste","categoria":"Mãos","unidade":"par","minimo":1}]')`);const item=await scalar('select id from public.items');const move=await scalar(`select public.move_stock('${item}','entrada',3,'Motivo original',gen_random_uuid())`);
await db.exec(`select public.update_reason('${reason}','Motivo atualizado','Novo aviso')`);assert.equal(await scalar(`select name from public.movement_reasons where id='${reason}'`),'Motivo atualizado');assert.equal(await scalar(`select reason from public.movements where id='${move}'`),'Motivo original');await assert.rejects(()=>db.exec(`select public.update_reason('${reason}','Compra de EPIs','')`));await assert.rejects(()=>db.exec(`select public.update_reason('${reason}','x','')`));
await as(operator);await assert.rejects(()=>db.exec(`select public.update_reason('${reason}','Negado','')`));await assert.rejects(()=>db.exec(`select public.delete_reason('${reason}')`));await as(admin,'aal1');await assert.rejects(()=>db.exec(`select public.delete_reason('${reason}')`));
await as(admin);await db.exec(`select public.delete_reason('${reason}')`);assert.equal(await scalar(`select count(*)::int from public.movement_reasons where id='${reason}'`),0);assert.equal(await scalar(`select reason from public.movements where id='${move}'`),'Motivo original');await assert.rejects(()=>db.exec(`select public.update_reason('${reason}','Já removido','')`));assert.equal(await scalar("select count(*)::int from public.audit where action in ('motivo editado','motivo excluído')"),2);await db.close();console.log('Motivos: editar/excluir, validações, unicidade, histórico preservado, auditoria e bloqueio de operador/sem MFA: OK.');
