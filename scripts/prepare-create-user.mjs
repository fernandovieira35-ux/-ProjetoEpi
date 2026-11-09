import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const source=await read('estoque/supabase/functions/create-user/index.ts');
const helpers=await Promise.all(['password-policy','username'].map(name=>read(`estoque/assets/js/${name}.js`)));
const result='// Gerado por scripts/prepare-create-user.mjs. Cole este arquivo inteiro no editor da Edge Function create-user.\n'+source.replace(/^import .*from '\.\.\/.*';\r?\n/gm,'').replace('Deno.serve(',helpers.map(s=>s.replace(/export /g,'')).join('\n')+'\nDeno.serve(');
await writeFile(new URL('estoque/supabase/create-user-dashboard.ts',root),result);
console.log('Arquivo único preparado: estoque/supabase/create-user-dashboard.ts');
