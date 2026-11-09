-- Após 003. Preserva requisições antigas; novas usam a conta autenticada.
begin;
drop function public.deliver_epi(uuid,integer,text,uuid,uuid,text);
alter table public.deliveries drop constraint deliveries_delivered_by_check;
alter table public.deliveries add constraint deliveries_delivered_by_check check(length(trim(delivered_by)) between 3 and 254);
create function public.deliver_epi(p_item uuid,p_quantity integer,p_reason text,p_request uuid,p_recipient uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare recipient public.recipients; equipment public.items; existing public.deliveries; result uuid; email text;
begin
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null or not private.can_access(equipment.category_id,true) then raise exception 'Acesso negado'; end if;
 select * into recipient from public.recipients where id=p_recipient;
 if recipient.id is null then raise exception 'Selecione um colaborador cadastrado'; end if;
 select d.* into existing from public.deliveries d join public.movements m on m.id=d.id where m.request_id=p_request;
 if existing.id is not null and (existing.recipient_id<>p_recipient) then raise exception 'Requisição já utilizada com outros dados'; end if;
 if existing.id is null and exists(select 1 from public.movements where request_id=p_request) then raise exception 'Identificador de movimento já utilizado'; end if;
 result:=public.move_stock(p_item,'saida',p_quantity,p_reason,p_request);
 if existing.id is not null then return result; end if;
 select u.email into email from auth.users u where u.id=auth.uid();
 insert into public.deliveries values(result,recipient.id,recipient.full_name,recipient.document_type||' ••••'||right(recipient.document_number,4),recipient.sector,coalesce(email,auth.uid()::text),coalesce(email,auth.uid()::text),equipment.name,equipment.sku,equipment.unit);
 insert into public.audit(actor,action,record_id) values(auth.uid(),'requisição de entrega criada',result::text);
 return result;
end $$;

revoke all on function public.deliver_epi(uuid,integer,text,uuid,uuid) from public,anon;
grant execute on function public.deliver_epi(uuid,integer,text,uuid,uuid) to authenticated;
commit;
