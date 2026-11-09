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
