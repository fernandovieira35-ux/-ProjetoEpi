-- Aplicar após 002. Cadastro pessoal separado das contas de login.
begin;
create function private.can_manage_recipients() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.categories c where private.can_access(c.id,true))
$$;
revoke all on function private.can_manage_recipients() from public,anon;
grant execute on function private.can_manage_recipients() to authenticated;
create table public.recipients (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check(length(trim(full_name)) between 3 and 120),
 document_type text not null check(document_type in ('CPF','RG')),
 document_number text not null check(document_number ~ '^[A-Z0-9]{5,20}$'),
 sector text not null check(length(trim(sector)) between 2 and 80),
 created_at timestamptz not null default now(),
 unique(document_type,document_number)
);
create table public.deliveries (
 id uuid primary key references public.movements(id),
 recipient_id uuid not null references public.recipients(id),
 recipient_name text not null, recipient_document text not null, recipient_sector text not null,
 delivered_by text not null check(length(trim(delivered_by)) between 3 and 120),
 actor_email text not null,
 item_name text not null, item_sku text not null, item_unit text not null
);
alter table public.recipients enable row level security;
alter table public.deliveries enable row level security;
revoke all on public.recipients,public.deliveries from anon,authenticated;
grant select on public.recipients,public.deliveries to authenticated;
create policy recipients_read on public.recipients for select to authenticated using(private.can_manage_recipients());
create policy deliveries_read on public.deliveries for select to authenticated using(exists(select 1 from public.movements m join public.items i on i.id=m.item_id where m.id=deliveries.id and private.can_access(i.category_id,true)));
create function public.create_recipient(p_name text,p_document_type text,p_document text,p_sector text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; doc text; sum integer; digit integer; pos integer;
begin
 if not private.can_manage_recipients() then raise exception 'Acesso negado'; end if;
 doc:=upper(regexp_replace(p_document,'[. /-]','','g'));
 if p_document_type='CPF' then
  if doc !~ '^[0-9]{11}$' or doc=repeat(left(doc,1),11) then raise exception 'CPF inválido'; end if;
  for pos in 10..11 loop
   sum:=0;
   for digit in 1..pos-1 loop sum:=sum+substring(doc,digit,1)::integer*(pos+1-digit); end loop;
   digit:=(sum*10)%11; if digit=10 then digit:=0; end if;
   if digit<>substring(doc,pos,1)::integer then raise exception 'CPF inválido'; end if;
  end loop;
 end if;
 insert into public.recipients(full_name,document_type,document_number,sector) values(trim(p_name),p_document_type,doc,trim(p_sector)) returning id into result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'recebedor cadastrado',result::text);
 return result;
end $$;
create function public.deliver_epi(p_item uuid,p_quantity integer,p_reason text,p_request uuid,p_recipient uuid,p_delivered_by text) returns uuid language plpgsql security definer set search_path='' as $$
declare recipient public.recipients; equipment public.items; existing public.deliveries; result uuid; email text;
begin
 select * into equipment from public.items where id=p_item for update;
 if equipment.id is null or not private.can_access(equipment.category_id,true) then raise exception 'Acesso negado'; end if;
 if p_delivered_by is null or length(trim(p_delivered_by)) not between 3 and 120 then raise exception 'Informe quem entregou'; end if;
 select * into recipient from public.recipients where id=p_recipient;
 if recipient.id is null then raise exception 'Selecione um colaborador cadastrado'; end if;
 select d.* into existing from public.deliveries d join public.movements m on m.id=d.id where m.request_id=p_request;
 if existing.id is not null and (existing.recipient_id<>p_recipient or existing.delivered_by<>trim(p_delivered_by)) then raise exception 'Requisição já utilizada com outros dados'; end if;
 if existing.id is null and exists(select 1 from public.movements where request_id=p_request) then raise exception 'Identificador de movimento já utilizado'; end if;
 result:=public.move_stock(p_item,'saida',p_quantity,p_reason,p_request);
 if existing.id is not null then return result; end if;
 select u.email into email from auth.users u where u.id=auth.uid();
 insert into public.deliveries values(result,recipient.id,recipient.full_name,recipient.document_type||' ••••'||right(recipient.document_number,4),recipient.sector,trim(p_delivered_by),coalesce(email,auth.uid()::text),equipment.name,equipment.sku,equipment.unit);
 insert into public.audit(actor,action,record_id) values(auth.uid(),'requisição de entrega criada',result::text);
 return result;
end $$;
revoke all on function public.create_recipient(text,text,text,text), public.deliver_epi(uuid,integer,text,uuid,uuid,text) from public,anon;
grant execute on function public.create_recipient(text,text,text,text), public.deliver_epi(uuid,integer,text,uuid,uuid,text) to authenticated;
commit;
