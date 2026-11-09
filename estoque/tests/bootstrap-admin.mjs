import assert from 'node:assert/strict';
import {bootstrap,generatePassword} from '../../scripts/bootstrap-admin.mjs';
import {requireStrongPassword} from '../assets/js/password-policy.js';
for(let i=0;i<100;i++){const password=generatePassword();assert.equal(password.length,24);requireStrongPassword(password);}
let calls=[];
const fetcher=async(url,options)=>{calls.push({url,options});if(calls.length===1)return Response.json([]);if(calls.length===2){const data=JSON.parse(options.body);assert.equal(data.email,'adcmim@usuarios.transcol.invalid');assert.equal(data.email_confirm,true);assert.deepEqual(data.app_metadata,{provision_access:true,username:'adcmim',access_role:'admin',access_active:true,must_change_password:true});requireStrongPassword(data.password);return Response.json({id:'test-id'});}return Response.json([{username:'adcmim',role:'admin',active:true,must_change_password:true,all_categories:true}]);};
const result=await bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',fetcher});assert.equal(result.username,'adcmim');assert.equal(calls.length,3);
await assert.rejects(bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',fetcher:async()=>Response.json([{id:'existing'}])}),/existe administrador/);
await assert.rejects(bootstrap({url:'https://test.supabase.co',key:'sb_publishable_test',fetcher}),/administrativa/);
await assert.rejects(bootstrap({url:'http://test.supabase.co',key:'sb_secret_test_only',fetcher}),/inválida/);
console.log('Bootstrap: senha forte, perfil ativo/admin, troca obrigatória e bloqueio de duplicidade: OK (API simulada).');
let reads=0;
const diagnostic=await bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',diagnostic:true,fetcher:async(url,options)=>{assert.equal(options.method,undefined);reads++;return Response.json(url.includes('/auth/')?{users:[{id:'existing',email:'adcmim@usuarios.transcol.invalid',app_metadata:{provision_access:true,access_role:'admin',must_change_password:true}}]}:[]);}});
assert.equal(reads,2);assert.equal(diagnostic.login_exists,true);assert.equal(diagnostic.profile_exists,false);assert.equal(diagnostic.provision_metadata_present,true);assert.equal('password' in diagnostic,false);
console.log('Diagnóstico: identifica login sem perfil, somente leitura e sem exibir senha/chave: OK.');
let recoveryCalls=[];
const recoveryFetch=async(url,options)=>{
 recoveryCalls.push(options.method||'GET');
 if(url.includes('/admin/users?'))return Response.json({users:[{id:'existing',email:'adcmim@usuarios.transcol.invalid',app_metadata:{provision_access:true,username:'adcmim',access_role:'admin'}}]});
 if(options.method==='PUT'){requireStrongPassword(JSON.parse(options.body).password);return Response.json({id:'existing'});}
 if(options.method==='PATCH')assert.deepEqual(JSON.parse(options.body),{must_change_password:true});
 return Response.json([{username:'adcmim',role:'admin',active:true,all_categories:true,must_change_password:true}]);
};
const recovered=await bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',recover:true,fetcher:recoveryFetch});
assert.equal(recovered.recovered,true);assert.deepEqual(recoveryCalls,['GET','GET','PUT','PATCH']);
await assert.rejects(bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',recover:true,diagnostic:true}),/não ambos/);
await assert.rejects(bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',recover:true,fetcher:async(url,options)=>{assert.equal(options.method,undefined);return url.includes('/admin/users?')?Response.json({users:[{id:'existing',email:'adcmim@usuarios.transcol.invalid',last_sign_in_at:'2026-11-08',app_metadata:{}}]}):Response.json([]);}}),/Recuperação bloqueada/);
console.log('Recuperação: redefine somente login elegível, restaura troca obrigatória e não cria usuário duplicado: OK.');
const chosen=generatePassword();let sent=false;
const selected=await bootstrap({url:'https://test.supabase.co',key:'sb_secret_test_only',recover:true,newPassword:chosen,confirmation:chosen,fetcher:async(url,options)=>{if(options.method==='PUT'){assert.equal(JSON.parse(options.body).password,chosen);sent=true;}return recoveryFetch(url,options);}});
assert.equal(sent,true);assert.equal(selected.password,chosen);
const noNetwork=()=>{throw new Error('Não deveria acessar a rede.');};
await assert.rejects(bootstrap({recover:true,newPassword:chosen,confirmation:chosen+'x',fetcher:noNetwork}),/não conferem/);
await assert.rejects(bootstrap({recover:true,newPassword:'short',confirmation:'short',fetcher:noNetwork}),/12 caracteres/);
console.log('Senha escolhida: envio exato, confirmação e força validadas antes de acessar a rede: OK.');
