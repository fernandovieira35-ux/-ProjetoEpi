import {cp,mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY. Chaves administrativas não são aceitas.');
const output=path.join(root,'dist');
try{await access(output);throw new Error('dist já existe. Use uma pasta de trabalho limpa para gerar a publicação.');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(output);
// Lista explícita: nenhum script administrativo, teste, SQL ou descarte entra no site.
for(const entry of ['index.html','assets','docs'])await cp(path.join(root,'estoque',entry),path.join(output,entry),{recursive:true});
const entryPage=path.join(output,'index.html');
await writeFile(entryPage,(await readFile(entryPage,'utf8')).replace('connect-src https://*.supabase.co',`connect-src ${url}`));
await writeFile(path.join(output,'assets/js/config.js'),`export const config=Object.freeze(${JSON.stringify({url,publishableKey:key})});\n`);
await writeFile(path.join(output,'.nojekyll'),'');
console.log('Site preparado em dist/. URL e chave publicável são públicas; nenhum segredo administrativo foi incluído.');
