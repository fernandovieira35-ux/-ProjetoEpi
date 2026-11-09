begin;
alter table public.items add column ca text check(ca ~ '^[0-9]{1,10}$');
alter table public.items add column validity_months integer check(validity_months between 1 and 120);
alter table public.deliveries add column item_ca text;
alter table public.deliveries add column validity_months integer;
alter table public.deliveries add column delivered_on date;
alter table public.deliveries add column due_date date;
alter table public.deliveries add column replaced_by uuid references public.deliveries(id);
alter table public.deliveries add column replaces_delivery uuid unique references public.deliveries(id);
create index deliveries_due on public.deliveries(due_date) where replaced_by is null;

create function private.snapshot_epi_expiry() returns trigger language plpgsql security definer set search_path='' as $$
declare equipment public.items; delivered_at timestamptz;
begin
 select i.* into equipment from public.items i join public.movements m on m.item_id=i.id where m.id=new.id;
 select created_at into delivered_at from public.movements where id=new.id;
 new.item_ca:=equipment.ca;new.validity_months:=equipment.validity_months;
 new.delivered_on:=(delivered_at at time zone 'America/Sao_Paulo')::date;
 new.due_date:=case when equipment.validity_months is not null then (new.delivered_on+make_interval(months=>equipment.validity_months))::date else null end;
 return new;
end $$;
revoke all on function private.snapshot_epi_expiry() from public,anon,authenticated;
create trigger snapshot_epi_expiry before insert on public.deliveries for each row execute function private.snapshot_epi_expiry();

create function public.set_epi_details(p_item uuid,p_ca text,p_months integer) returns void language plpgsql security definer set search_path='' as $$
declare equipment public.items;
begin
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null or not private.can_access(equipment.category_id,true) then raise exception 'Acesso negado'; end if;
 update public.items set ca=nullif(trim(p_ca),''),validity_months=p_months where id=p_item;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'CA e prazo de troca atualizados',p_item::text);
end $$;
revoke all on function public.set_epi_details(uuid,text,integer) from public,anon;
grant execute on function public.set_epi_details(uuid,text,integer) to authenticated;

-- Importação original continua responsável por validar e criar o item.
alter function public.import_items(jsonb) rename to import_items_without_expiry;
alter function public.import_items_without_expiry(jsonb) set schema private;
revoke all on function private.import_items_without_expiry(jsonb) from public,anon,authenticated;
create function public.import_items(p_rows jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare result integer; r jsonb;
begin
 result:=private.import_items_without_expiry(p_rows);
 for r in select value from jsonb_array_elements(p_rows) loop
  if nullif(r->>'validade_meses','') is not null and (r->>'validade_meses') !~ '^[0-9]{1,3}$' then raise exception 'Prazo inválido'; end if;
  update public.items set ca=nullif(trim(r->>'ca'),''),validity_months=nullif(r->>'validade_meses','')::integer where sku=r->>'codigo';
 end loop;
 return result;
end $$;
revoke all on function public.import_items(jsonb) from public,anon;
grant execute on function public.import_items(jsonb) to authenticated;

-- Restauração não pode ignorar silenciosamente divergências dos campos novos.
alter function public.restore_inventory(jsonb,uuid) rename to restore_inventory_without_expiry;
alter function public.restore_inventory_without_expiry(jsonb,uuid) set schema private;
revoke all on function private.restore_inventory_without_expiry(jsonb,uuid) from public,anon,authenticated;
create function public.restore_inventory(p_rows jsonb,p_request uuid) returns integer language plpgsql security definer set search_path='' as $$
declare result integer; r jsonb; equipment public.items;
begin
 result:=private.restore_inventory_without_expiry(p_rows,p_request);
 for r in select value from jsonb_array_elements(p_rows) loop
  select * into equipment from public.items where sku=r->>'codigo';
  if (r ? 'ca' and equipment.ca is distinct from nullif(trim(r->>'ca'),'')) or (r ? 'validade_meses' and equipment.validity_months is distinct from nullif(r->>'validade_meses','')::integer) then raise exception 'CA ou prazo diferente do cadastro existente'; end if;
 end loop;
 return result;
end $$;
revoke all on function public.restore_inventory(jsonb,uuid) from public,anon;
grant execute on function public.restore_inventory(jsonb,uuid) to authenticated;

alter function public.deliver_epi(uuid,integer,text,uuid,uuid) rename to deliver_epi_without_replacement;
alter function public.deliver_epi_without_replacement(uuid,integer,text,uuid,uuid) set schema private;
revoke all on function private.deliver_epi_without_replacement(uuid,integer,text,uuid,uuid) from public,anon,authenticated;
create function public.deliver_epi(p_item uuid,p_quantity integer,p_reason text,p_request uuid,p_recipient uuid,p_replaces uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; previous public.deliveries; old_move public.movements; existing public.deliveries; equipment public.items;
begin
 -- Ordem de locks: item, entrega anterior; repetição da mesma solicitação é idempotente.
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null or not private.can_access(equipment.category_id,true) then raise exception 'Acesso negado'; end if;
 select d.* into existing from public.deliveries d join public.movements m on m.id=d.id where m.request_id=p_request;
 if existing.id is not null and existing.replaces_delivery is distinct from p_replaces then raise exception 'Solicitação já utilizada com outra troca'; end if;
 if p_replaces is not null then
  select * into previous from public.deliveries where id=p_replaces for update;
  select * into old_move from public.movements where id=p_replaces;
  if previous.id is null or previous.recipient_id<>p_recipient or old_move.item_id<>p_item or p_quantity<old_move.quantity or (previous.replaced_by is not null and previous.replaced_by is distinct from existing.id) then raise exception 'Troca inválida: confira colaborador, EPI, quantidade e entrega anterior'; end if;
 end if;
 result:=private.deliver_epi_without_replacement(p_item,p_quantity,p_reason,p_request,p_recipient);
 if p_replaces is not null then
  update public.deliveries set replaces_delivery=p_replaces where id=result;
  update public.deliveries set replaced_by=result where id=p_replaces;
 end if;
 return result;
end $$;
revoke all on function public.deliver_epi(uuid,integer,text,uuid,uuid,uuid) from public,anon;
grant execute on function public.deliver_epi(uuid,integer,text,uuid,uuid,uuid) to authenticated;
commit;
