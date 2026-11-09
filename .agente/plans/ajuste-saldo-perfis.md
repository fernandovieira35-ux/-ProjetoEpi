# Ajuste de saldo e perfis

- Administrador: entradas, ajuste direto, restauração e gestão de acesso. Simples (papel técnico operador): cadastros de EPIs/colaboradores e saídas; não gerencia usuários/categorias/motivos nem corrige saldo. Leitor legado continua restrito.
- Migração 010 protege entradas no servidor, cria ajuste idempotente com saldo esperado e snapshots antes/depois, horário e identidade em movimentos novos. Não presumir saldo anterior de históricos antigos.
- Estação informada opcional no ajuste, sem prometer hostname real do navegador. Exibir e exportar auditoria.
- Validar ataques via RPC, replay, concorrência otimista, permissões e interface. Implantação real pendente.
