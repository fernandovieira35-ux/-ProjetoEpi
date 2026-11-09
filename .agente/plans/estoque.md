# Plano: estoque de EPIs

Preservar Morada e implementar aplicação independente em `estoque/`, HTML/CSS/JS sem build, Supabase Auth e PostgreSQL com RLS. O pedido atual autoriza JavaScript e bibliotecas necessárias, substituindo a restrição da atividade anterior.

- Criar interface responsiva, categorias, itens, movimentações, relatórios, impressão e Excel.
- Restringir acesso por categoria e perfil; mutações atômicas, trilha de auditoria e validação no banco.
- Entregar migração, configuração pública de exemplo, implantação GitHub Pages e revisão de segurança.
- Verificar navegador, importação e regras com os recursos locais; explicitar testes que dependem de Supabase provisionado.

Hospedagem externa não provisionada: usuário pediu estrutura para Git; não há repositório Git nem projeto Supabase conectado.

## Entrega e validação

Implementados interface, SQL/RLS/MFA, movimentações atômicas, Excel com prévia, restauração administrativa de saldos, relatórios, gráfico e impressão. Documentação em `estoque/docs/`.

Executadas 30 verificações de PostgreSQL via PGlite e verificações Edge/Playwright com API simulada, XLSX real, XSS e três larguras. Integração Supabase real, concorrência de rede, publicação e impressora física não verificadas.
