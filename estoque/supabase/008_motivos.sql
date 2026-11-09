begin;
create table public.movement_reasons(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 3 and 200),
 guidance text not null default '' check(length(guidance)<=500),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create unique index movement_reasons_name on public.movement_reasons(lower(name));
insert into public.movement_reasons(name,guidance) values
 ('Troca de EPI por prazo de uso','Confira a data prevista de troca. Para encerrar o alerta anterior, vincule a entrega no campo Substitui uma entrega anterior.'),
 ('Troca de EPI por danificação','Confira o equipamento danificado e registre a substituição da entrega anterior quando aplicável.'),
 ('Entrega inicial de EPI','Use para a primeira entrega do equipamento ao colaborador.'),
 ('Reposição de estoque','Use ao registrar uma entrada para repor o estoque.'),
 ('Compra de EPIs','Use para entradas de equipamentos adquiridos.');
alter table public.movement_reasons enable row level security;
revoke all on public.movement_reasons from anon,authenticated;
grant select on public.movement_reasons to authenticated;
create policy reasons_read on public.movement_reasons for select to authenticated using(private.is_admin() or (active and private.can_manage_recipients()));
create function public.create_reason(p_name text,p_guidance text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not private.is_admin() then raise exception 'Somente administrador com MFA pode cadastrar motivos'; end if;
 insert into public.movement_reasons(name,guidance) values(regexp_replace(trim(p_name),'\s+',' ','g'),trim(coalesce(p_guidance,''))) returning id into result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'motivo cadastrado',result::text);
 return result;
end $$;
create function public.set_reason_active(p_reason uuid,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() or p_active is null then raise exception 'Acesso negado'; end if;
 update public.movement_reasons set active=p_active where id=p_reason;
 if not found then raise exception 'Motivo não encontrado'; end if;
 insert into public.audit(actor,action,record_id) values(auth.uid(),case when p_active then 'motivo ativado' else 'motivo desativado' end,p_reason::text);
end $$;
revoke all on function public.create_reason(text,text),public.set_reason_active(uuid,boolean) from public,anon;
grant execute on function public.create_reason(text,text),public.set_reason_active(uuid,boolean) to authenticated;
-- As funções de movimentação e restauração abaixo mantêm os motivos de sistema
-- restritos ao fluxo administrativo e exigem catálogo nas operações comuns.

create function private.move_stock_system(p_item uuid,p_kind text,p_quantity integer,p_reason text,p_request uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare item public.items; previous public.movements; result uuid;
begin
 select * into item from public.items where id=p_item for update;
 if item.id is null or not private.can_access(item.category_id,true) then raise exception 'Acesso negado'; end if;
 select * into previous from public.movements where request_id=p_request;
 if previous.id is not null then
  if previous.actor=auth.uid() and previous.item_id=p_item and previous.kind=p_kind and previous.quantity=p_quantity and previous.reason=trim(p_reason) then return previous.id; end if;
  raise exception 'Identificador de operação já utilizado';
 end if;
 if p_kind not in ('entrada','saida') or p_kind is null or p_quantity is null or p_quantity not between 1 and 1000000 then raise exception 'Movimentação inválida'; end if;
 if p_kind='saida' and item.balance<p_quantity then raise exception 'Saldo insuficiente'; end if;
 update public.items set balance=balance + case when p_kind='entrada' then p_quantity else -p_quantity end where id=p_item;
 insert into public.movements(request_id,item_id,kind,quantity,reason,actor) values(p_request,p_item,p_kind,p_quantity,trim(p_reason),auth.uid()) returning id into result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'movimentação registrada',result::text);
 return result;
end $$;

revoke all on function private.move_stock_system(uuid,text,integer,text,uuid) from public,anon,authenticated;
create or replace function public.move_stock(p_item uuid,p_kind text,p_quantity integer,p_reason text,p_request uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare item public.items; previous public.movements; result uuid;
begin
 select * into item from public.items where id=p_item for update;
 if item.id is null or not private.can_access(item.category_id,true) then raise exception 'Acesso negado'; end if;
 select * into previous from public.movements where request_id=p_request;
 if previous.id is not null then
  if previous.actor=auth.uid() and previous.item_id=p_item and previous.kind=p_kind and previous.quantity=p_quantity and previous.reason=trim(p_reason) then return previous.id; end if;
  raise exception 'Identificador de operação já utilizado';
 end if;
 perform 1 from public.movement_reasons where name=trim(p_reason) and active for share;
 if not found then raise exception 'Selecione um motivo ativo cadastrado'; end if;
 if p_kind not in ('entrada','saida') or p_kind is null or p_quantity is null or p_quantity not between 1 and 1000000 then raise exception 'Movimentação inválida'; end if;
 if p_kind='saida' and item.balance<p_quantity then raise exception 'Saldo insuficiente'; end if;
 update public.items set balance=balance + case when p_kind='entrada' then p_quantity else -p_quantity end where id=p_item;
 insert into public.movements(request_id,item_id,kind,quantity,reason,actor) values(p_request,p_item,p_kind,p_quantity,trim(p_reason),auth.uid()) returning id into result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'movimentação registrada',result::text);
 return result;
end $$;

create or replace function private.restore_inventory_without_expiry(p_rows jsonb,p_request uuid) returns integer language plpgsql security definer set search_path = '' as $$
declare r jsonb; current_item public.items; category uuid; target integer; difference integer; total integer:=0;
begin
 if not private.is_admin() then raise exception 'Somente administrador com MFA pode restaurar'; end if;
 if p_request is null or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'Lote inválido'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_request::text));
 if exists(select 1 from public.audit where action='inventário restaurado' and record_id=p_request::text) then raise exception 'Esta restauração já foi concluída. Atualize os dados.'; end if;
 if (select count(distinct value->>'codigo') from jsonb_array_elements(p_rows))<>jsonb_array_length(p_rows) then raise exception 'Códigos duplicados'; end if;
 for r in select value from jsonb_array_elements(p_rows) order by value->>'codigo' loop
  target:=(r->>'saldo')::integer;
  if target is null or target not between 0 and 1000000 then raise exception 'Saldo deve estar entre 0 e 1000000'; end if;
  select id into category from public.categories where name=r->>'categoria';
  if category is null then raise exception 'Cadastre as categorias antes de restaurar'; end if;
  select * into current_item from public.items where sku=r->>'codigo' for update;
  if current_item.id is null then
   perform public.import_items(jsonb_build_array(r));
   select * into current_item from public.items where sku=r->>'codigo' for update;
  end if;
  if current_item.category_id is distinct from category or current_item.name is distinct from (r->>'nome') or current_item.unit is distinct from (r->>'unidade') or current_item.minimum is distinct from (r->>'minimo')::integer then raise exception 'Metadados diferentes do cadastro existente'; end if;
  difference:=target-current_item.balance;
  if difference<>0 then
   perform private.move_stock_system(current_item.id,case when difference>0 then 'entrada' else 'saida' end,abs(difference),'Restauração Excel '||p_request::text,gen_random_uuid());
  end if;
  total:=total+1;
 end loop;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'inventário restaurado',p_request::text);
 return total;
end $$;

commit;
