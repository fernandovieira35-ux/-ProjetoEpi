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
for(const file of ['001_estoque','002_restauracao_excel','003_recebedores','004_entregador_automatico','005_usuarios_primeiro_acesso','006_validade_ca','007_codigo_sequencial'])await db.exec(readFileSync(new URL('../supabase/'+file+'.sql',import.meta.url),'utf8'));


const admin='00000000-0000-4000-8000-000000000001',reader='00000000-0000-4000-8000-000000000002';await db.exec(`insert into auth.users(id) values('${admin}'),('${reader}');insert into public.profiles(id,role) values('${admin}','admin'),('${reader}','leitor');`);
async function as(id,aal='aal2'){await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claim.aal='${aal}';set role authenticated;`);}async function scalar(sql){return Object.values((await db.query(sql)).rows[0])[0];}
await as(admin);await db.exec("select public.create_category('Mãos')");assert.equal((await scalar('select public.epi_code_status()')).next_code,'EPI-001');
const row={nome:'Luva teste',categoria:'Mãos',unidade:'par',minimo:1,ca:'12345',validade_meses:6};
const request='10000000-0000-4000-8000-000000000001';const sql=`select public.create_epi('${JSON.stringify(row)}',false,'${request}')`;const first=await scalar(sql);assert.equal(first.codigo,'EPI-001');assert.deepEqual(await scalar(sql),first);assert.equal(await scalar('select count(*)::int from public.items'),1);
await assert.rejects(()=>db.exec(`select public.create_epi('${JSON.stringify({...row,nome:'Outro'})}',false,'${request}')`));
await db.exec(`select public.import_items('${JSON.stringify([{...row,codigo:'EPI-050'},{...row,codigo:'OUTRO'}])}')`);assert.equal((await scalar('select public.epi_code_status()')).next_code,'EPI-051');
assert.equal((await scalar(`select public.create_epi('${JSON.stringify(row)}',false,gen_random_uuid())`)).codigo,'EPI-051');
await assert.rejects(()=>db.exec(`select public.create_epi('${JSON.stringify({...row,codigo:'EPI-051'})}',true,gen_random_uuid())`));
await assert.rejects(()=>db.exec(`select public.create_epi('${JSON.stringify({...row,validade_meses:0})}',false,gen_random_uuid())`));assert.equal((await scalar('select public.epi_code_status()')).next_code,'EPI-052');
await db.exec(`select public.create_epi('${JSON.stringify({...row,codigo:'EPI-999'})}',true,gen_random_uuid())`);assert.equal((await scalar(`select public.create_epi('${JSON.stringify(row)}',false,gen_random_uuid())`)).codigo,'EPI-1000');
await db.exec(`select public.import_items('${JSON.stringify([{...row,codigo:'EPI-9007199254740993'}])}')`);assert.equal((await scalar(`select public.create_epi('${JSON.stringify(row)}',false,gen_random_uuid())`)).codigo,'EPI-9007199254740994');
await as(reader);await assert.rejects(()=>db.exec('select public.epi_code_status()'));await assert.rejects(()=>db.exec('select * from private.epi_numbering'));await assert.rejects(()=>db.exec(`select public.create_epi('${JSON.stringify(row)}',false,gen_random_uuid())`));await as(admin,'aal1');await assert.rejects(()=>db.exec('select public.epi_code_status()'));
await db.close();const {codeStatus,normalizeManualCode}=await import('../assets/js/epi-code.js');assert.equal(normalizeManualCode('EPI - 50'),'EPI-050');assert.equal(codeStatus([{sku:'EPI-999'},{sku:'OUTRO'}]).next_code,'EPI-1000');console.log('Código sequencial: início, avanço por Excel/manual, repetição idempotente, duplicidade, rollback, números longos, permissões e MFA: OK.');
