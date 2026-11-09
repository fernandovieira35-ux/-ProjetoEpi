import {config} from '../estoque/assets/js/config.js';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url))throw new Error('URL do projeto inválida.');
process.stdout.write(config.url);
