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





const admin='00000000-0000-4000-8000-000000000001',simple='00000000-0000-4000-8000-000000000002';await db.exec(`insert into auth.users(id,email) values('${admin}','admin@example.test'),('${simple}','simple@example.test');insert into public.profiles(id,role,username) values('${admin}','admin','administrador'),('${simple}','operador','simples');`);
async function as(id,aal='aal2'){await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claim.aal='${aal}';set role authenticated;`);}async function scalar(sql){return Object.values((await db.query(sql)).rows[0])[0];}
await as(admin);const cat=await scalar("select public.create_category('Mãos')");await db.exec(`select public.set_access('${simple}','operador',true,array['${cat}'::uuid]);select public.import_items('[{"codigo":"TESTE","nome":"Luva teste","categoria":"Mãos","unidade":"par","minimo":1}]');`);const item=await scalar('select id from public.items');const old=await scalar(`select public.move_stock('${item}','entrada',10,'Compra de EPIs',gen_random_uuid())`);
await db.exec('reset role');await db.exec(readFileSync(new URL('../supabase/010_ajuste_saldo.sql',import.meta.url),'utf8'));await as(admin);assert.equal(await scalar(`select balance_before from public.movements where id='${old}'`),null);
const request='10000000-0000-4000-8000-000000000001',sql=`select public.adjust_stock('${item}',15,10,'Ajuste de saldo por inventário','ALMOX-01','${request}')`;const adjusted=await scalar(sql);assert.equal(await scalar(sql),adjusted);assert.deepEqual((await db.query(`select balance_before,balance_after,actor_name,is_adjustment,workstation_label from public.movements where id='${adjusted}'`)).rows[0],{balance_before:10,balance_after:15,actor_name:'administrador',is_adjustment:true,workstation_label:'ALMOX-01'});
await assert.rejects(()=>db.exec(`select public.adjust_stock('${item}',14,10,'Ajuste de saldo por inventário','',gen_random_uuid())`));assert.equal(await scalar('select balance from public.items'),15);await assert.rejects(()=>db.exec(`select public.adjust_stock('${item}',15,15,'Ajuste de saldo por inventário','',gen_random_uuid())`));
await as(simple);await assert.rejects(()=>db.exec(`select public.adjust_stock('${item}',50,15,'Ajuste de saldo por inventário','',gen_random_uuid())`));await assert.rejects(()=>db.exec(`select public.move_stock('${item}','entrada',5,'Compra de EPIs',gen_random_uuid())`));await assert.rejects(()=>db.exec(`select private.move_stock_catalog('${item}','entrada',5,'Compra de EPIs',gen_random_uuid())`));await assert.rejects(()=>db.exec('update public.items set balance=100'));await assert.rejects(()=>db.exec("select public.restore_inventory('[]',gen_random_uuid())"));await assert.rejects(()=>db.exec('update public.movements set balance_before=0'));
await db.exec(`select public.import_items('[{"codigo":"SIMPLES","nome":"EPI novo","categoria":"Mãos","unidade":"un","minimo":0,"saldo":999}]')`);assert.equal(await scalar("select balance from public.items where sku='SIMPLES'"),0);
const recipient=await scalar("select public.create_recipient('Colaborador Teste','RG','TESTE0001','Transporte')");const delivery=await scalar(`select public.deliver_epi('${item}',2,'Entrega inicial de EPI',gen_random_uuid(),'${recipient}')`);assert.deepEqual((await db.query(`select balance_before,balance_after,actor_name from public.movements where id='${delivery}'`)).rows[0],{balance_before:15,balance_after:13,actor_name:'simples'});
await as(admin);const down=await scalar(`select public.adjust_stock('${item}',8,13,'Ajuste de saldo por inventário','',gen_random_uuid())`);assert.equal(await scalar(`select balance_after from public.movements where id='${down}'`),8);
await db.exec(`select public.restore_inventory('[{"codigo":"TESTE","nome":"Luva teste","categoria":"Mãos","unidade":"par","minimo":1,"saldo":12}]',gen_random_uuid())`);assert.equal(await scalar("select balance_before from public.movements where reason like 'Restauração Excel%'"),8);assert.equal(await scalar("select balance_after from public.movements where reason like 'Restauração Excel%'"),12);
await as(admin,'aal1');await assert.rejects(()=>db.exec(sql));await db.close();console.log('Ajustes: admin/MFA, bloqueio de simples/entrada/restauração/bypass, cadastros e saídas permitidos, snapshots, nome, estação, replay e saldo desatualizado: OK.');
