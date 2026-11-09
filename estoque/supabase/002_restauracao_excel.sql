-- Aplicar após 001. Restaura SOMENTE inventário: não usuários nem histórico.
begin;
create function public.restore_inventory(p_rows jsonb,p_request uuid) returns integer language plpgsql security definer set search_path = '' as $$
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
   perform public.move_stock(current_item.id,case when difference>0 then 'entrada' else 'saida' end,abs(difference),'Restauração Excel '||p_request::text,gen_random_uuid());
  end if;
  total:=total+1;
 end loop;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'inventário restaurado',p_request::text);
 return total;
end $$;
revoke all on function public.restore_inventory(jsonb,uuid) from public,anon;
grant execute on function public.restore_inventory(jsonb,uuid) to authenticated;
commit;
