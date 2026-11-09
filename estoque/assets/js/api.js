import { config } from './config.js';
export const demoMode = new URLSearchParams(location.search).get('demo') === '1';
const demo = demoMode ? await import('./demo.js') : null;
export const configured = demoMode || /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url) && config.publishableKey.startsWith('sb_publishable_');
export const client = demoMode ? demo.demoClient : configured ? window.supabase.createClient(config.url, config.publishableKey, {
 auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
}) : null;
export async function rpc(name, args) {
 if(demoMode)return demo.demoRpc(name,args);
 const { data, error } = await client.rpc(name, args);
 if (error) throw new Error(error.message);
 return data;
}
export async function rows(table) {
 if(demoMode)return demo.demoRows(table);
 const result = [];
 for (let start=0;;start+=500) {
  const {data,error} = await client.from(table).select('*').order('id').range(start,start+499);
  if(error) throw new Error(error.message);
  result.push(...data);
  if(data.length<500) return result;
  if(result.length>=50000) throw new Error('Consulta excedeu 50 mil registros. Use relatórios segmentados antes de ampliar a operação.');
 }
}
