begin;
alter table public.movements add column balance_before integer;
alter table public.movements add column balance_after integer;
alter table public.movements add column actor_name text;
alter table public.movements add column is_adjustment boolean not null default false;
alter table public.movements add column workstation_label text check(length(workstation_label)<=100);
alter table public.movements add constraint movement_balances_valid check(balance_before between 0 and 100000000 and balance_after between 0 and 100000000 and balance_after=balance_before+case when kind='entrada' then quantity else -quantity end);
create function private.movement_balance_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 select balance into new.balance_after from public.items where id=new.item_id;
 new.balance_before:=new.balance_after-case when new.kind='entrada' then new.quantity else -new.quantity end;
 select coalesce(p.username,u.email,new.actor::text) into new.actor_name from public.profiles p join auth.users u on u.id=p.id where p.id=new.actor;
 new.created_at:=clock_timestamp();
 return new;
end $$;
revoke all on function private.movement_balance_snapshot() from public,anon,authenticated;
create trigger movement_balance_snapshot before insert on public.movements for each row execute function private.movement_balance_snapshot();

-- A rotina existente continua validando motivo, saldo e idempotência.
alter function public.move_stock(uuid,text,integer,text,uuid) rename to move_stock_catalog;
alter function public.move_stock_catalog(uuid,text,integer,text,uuid) set schema private;
revoke all on function private.move_stock_catalog(uuid,text,integer,text,uuid) from public,anon,authenticated;
create function public.move_stock(p_item uuid,p_kind text,p_quantity integer,p_reason text,p_request uuid) returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Movimentação direta de saldo é exclusiva do administrador. Use a entrega a colaborador para registrar saída'; end if;
 return private.move_stock_catalog(p_item,p_kind,p_quantity,p_reason,p_request);
end $$;
revoke all on function public.move_stock(uuid,text,integer,text,uuid) from public,anon;
grant execute on function public.move_stock(uuid,text,integer,text,uuid) to authenticated;

create function public.adjust_stock(p_item uuid,p_balance integer,p_expected integer,p_reason text,p_station text,p_request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare equipment public.items; previous public.movements; difference integer; result uuid;
begin
 if not private.is_admin() then raise exception 'Somente administrador com MFA pode ajustar o saldo'; end if;
 if p_request is null or p_balance is null or p_balance not between 0 and 100000000 or p_expected is null or length(coalesce(p_station,''))>100 then raise exception 'Ajuste inválido'; end if;
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null then raise exception 'EPI não encontrado'; end if;
 select * into previous from public.movements where request_id=p_request;
 if previous.id is not null then
  if previous.is_adjustment and previous.actor=auth.uid() and previous.item_id=p_item and previous.balance_before=p_expected and previous.balance_after=p_balance and previous.reason=trim(p_reason) and coalesce(previous.workstation_label,'')=trim(coalesce(p_station,'')) then return previous.id; end if;
  raise exception 'Solicitação já utilizada com outro ajuste';
 end if;
 if equipment.balance<>p_expected then raise exception 'Saldo mudou desde a consulta. Atualize os dados e confira o novo saldo antes de ajustar'; end if;
 difference:=p_balance-equipment.balance;
 if difference=0 then raise exception 'O novo saldo é igual ao saldo atual'; end if;
 if abs(difference)>1000000 then raise exception 'Diferença máxima por ajuste: 1000000'; end if;
 result:=public.move_stock(p_item,case when difference>0 then 'entrada' else 'saida' end,abs(difference),p_reason,p_request);
 update public.movements set is_adjustment=true,workstation_label=nullif(trim(p_station),'') where id=result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'saldo ajustado com valores anterior e novo',result::text);
 return result;
end $$;
revoke all on function public.adjust_stock(uuid,integer,integer,text,text,uuid) from public,anon;
grant execute on function public.adjust_stock(uuid,integer,integer,text,text,uuid) to authenticated;
insert into public.movement_reasons(name,guidance) values('Ajuste de saldo por inventário','Confira o saldo físico e o saldo anterior. Somente administradores podem ajustar.') on conflict do nothing;

-- Usuário simples só reduz estoque por entrega validada a colaborador.
create or replace function private.deliver_epi_without_replacement(p_item uuid,p_quantity integer,p_reason text,p_request uuid,p_recipient uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare recipient public.recipients; equipment public.items; existing public.deliveries; result uuid; email text;
begin
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null or not private.can_access(equipment.category_id,true) then raise exception 'Acesso negado'; end if;
 select * into recipient from public.recipients where id=p_recipient;
 if recipient.id is null then raise exception 'Selecione um colaborador cadastrado'; end if;
 select d.* into existing from public.deliveries d join public.movements m on m.id=d.id where m.request_id=p_request;
 if existing.id is not null and (existing.recipient_id<>p_recipient) then raise exception 'Requisição já utilizada com outros dados'; end if;
 if existing.id is null and exists(select 1 from public.movements where request_id=p_request) then raise exception 'Identificador de movimento já utilizado'; end if;
 result:=private.move_stock_catalog(p_item,'saida',p_quantity,p_reason,p_request);
 if existing.id is not null then return result; end if;
 select coalesce(p.username,u.email) into email from auth.users u join public.profiles p on p.id=u.id where u.id=auth.uid();
 insert into public.deliveries values(result,recipient.id,recipient.full_name,recipient.document_type||' ••••'||right(recipient.document_number,4),recipient.sector,coalesce(email,auth.uid()::text),coalesce(email,auth.uid()::text),equipment.name,equipment.sku,equipment.unit);
 insert into public.audit(actor,action,record_id) values(auth.uid(),'requisição de entrega criada',result::text);
 return result;
end $$;
commit;
