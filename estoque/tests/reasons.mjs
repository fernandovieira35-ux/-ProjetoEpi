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
for(const file of ['001_estoque','002_restauracao_excel','003_recebedores','004_entregador_automatico','005_usuarios_primeiro_acesso','006_validade_ca','007_codigo_sequencial','008_motivos'])await db.exec(readFileSync(new URL('../supabase/'+file+'.sql',import.meta.url),'utf8'));



const admin='00000000-0000-4000-8000-000000000001',operator='00000000-0000-4000-8000-000000000002',reader='00000000-0000-4000-8000-000000000003';await db.exec(`insert into auth.users(id) values('${admin}'),('${operator}'),('${reader}');insert into public.profiles(id,role) values('${admin}','admin'),('${operator}','operador'),('${reader}','leitor');`);
async function as(id,aal='aal2'){await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claim.aal='${aal}';set role authenticated;`);}async function scalar(sql){return Object.values((await db.query(sql)).rows[0])[0];}
await as(admin);assert.equal(await scalar('select count(*)::int from public.movement_reasons'),5);const reason=await scalar("select public.create_reason('Troca por desgaste','Confira o equipamento.')");await assert.rejects(()=>db.exec("select public.create_reason('troca por desgaste','')"));
const cat=await scalar("select public.create_category('Mãos')");await db.exec(`select public.set_access('${operator}','operador',true,array['${cat}'::uuid]);select public.set_access('${reader}','leitor',true,array['${cat}'::uuid]);`);
const row={codigo:'TESTE',nome:'Luva teste',categoria:'Mãos',unidade:'par',minimo:1};await db.exec(`select public.import_items('${JSON.stringify([row])}')`);const item=await scalar('select id from public.items');
await as(operator);await assert.rejects(()=>db.exec("select public.create_reason('Negado','')"));await db.exec(`select public.move_stock('${item}','entrada',10,'Reposição de estoque',gen_random_uuid())`);await assert.rejects(()=>db.exec(`select public.move_stock('${item}','saida',1,'Texto livre',gen_random_uuid())`));
const recipient=await scalar("select public.create_recipient('Colaborador Teste','RG','TESTE0001','Transporte')");const request='10000000-0000-4000-8000-000000000001';const sql=`select public.deliver_epi('${item}',1,'Troca por desgaste','${request}','${recipient}')`;const delivery=await scalar(sql);
await as(admin);await db.exec(`select public.set_reason_active('${reason}',false)`);await as(operator);assert.equal(await scalar(sql),delivery);await assert.rejects(()=>db.exec(`select public.deliver_epi('${item}',1,'Troca por desgaste',gen_random_uuid(),'${recipient}')`));assert.equal(await scalar('select balance from public.items'),9);assert.equal(await scalar("select count(*)::int from public.movement_reasons where not active"),0);
await assert.rejects(()=>db.exec(`select private.move_stock_system('${item}','entrada',1,'Bypass',gen_random_uuid())`));
await as(admin);await db.exec(`select public.restore_inventory('${JSON.stringify([{...row,saldo:12}])}',gen_random_uuid())`);assert.equal(await scalar('select balance from public.items'),12);assert.equal(await scalar(`select reason from public.movements where id='${delivery}'`),'Troca por desgaste');
await as(reader);assert.equal(await scalar('select count(*)::int from public.movement_reasons'),0);await as(admin,'aal1');await assert.rejects(()=>db.exec("select public.create_reason('Negado MFA','')"));await db.close();console.log('Motivos: cadastro/duplicidade, ativo/inativo, entrega, replay, histórico, restauração e permissões/MFA: OK.');
