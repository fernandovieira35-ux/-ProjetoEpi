begin;
create table private.epi_numbering(singleton boolean primary key default true check(singleton),last_number numeric(36,0) not null check(last_number>=0));
insert into private.epi_numbering(singleton,last_number)
select true,coalesce(max(substring(upper(sku) from 5)::numeric),0) from public.items where upper(sku) ~ '^EPI-[0-9]{1,36}$';
revoke all on private.epi_numbering from public,anon,authenticated;
create function private.epi_code(n numeric) returns text language sql immutable set search_path='' as $$
 select 'EPI-'||lpad(n::text,greatest(3,length(n::text)),'0')
$$;
create function private.track_epi_number() returns trigger language plpgsql security definer set search_path='' as $$
begin
 -- Todos os INSERTs, inclusive Excel, participam do mesmo lock transacional.
 perform 1 from private.epi_numbering where singleton for update;
 if upper(new.sku) ~ '^EPI-[0-9]{1,36}$' then
  update private.epi_numbering set last_number=greatest(last_number,substring(upper(new.sku) from 5)::numeric) where singleton;
 end if;
 return new;
end $$;
create trigger track_epi_number before insert on public.items for each row execute function private.track_epi_number();
revoke all on function private.epi_code(numeric),private.track_epi_number() from public,anon,authenticated;
create function public.epi_code_status() returns jsonb language plpgsql security definer set search_path='' as $$
declare n numeric;
begin
 if not (private.is_admin() or private.can_manage_recipients()) then raise exception 'Acesso negado'; end if;
 select last_number into n from private.epi_numbering where singleton;
 return jsonb_build_object('last_code',case when n=0 then null else private.epi_code(n) end,'next_code',case when n<999999999999999999999999999999999999 then private.epi_code(n+1) else null end);
end $$;
create table private.epi_create_requests(request_id uuid primary key,actor uuid not null,row_data jsonb not null,manual boolean not null,item_id uuid not null references public.items(id));
revoke all on private.epi_create_requests from public,anon,authenticated;
create function public.create_epi(p_row jsonb,p_manual boolean,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare category uuid; previous private.epi_create_requests; n numeric; code text; result uuid;
begin
 if p_row is null or jsonb_typeof(p_row)<>'object' or p_manual is null or p_request is null then raise exception 'Cadastro inválido'; end if;
 select id into category from public.categories where name=p_row->>'categoria';
 if category is null or not private.can_access(category,true) then raise exception 'Categoria inexistente ou acesso negado'; end if;
 select last_number into n from private.epi_numbering where singleton for update;
 select * into previous from private.epi_create_requests where request_id=p_request;
 if previous.request_id is not null then
  if previous.actor<>auth.uid() or previous.row_data<>p_row or previous.manual<>p_manual then raise exception 'Solicitação já utilizada com outro cadastro'; end if;
  select sku into code from public.items where id=previous.item_id;
  return jsonb_build_object('id',previous.item_id,'codigo',code);
 end if;
 if p_manual then code:=trim(p_row->>'codigo');
 else
  if n>=999999999999999999999999999999999999 then raise exception 'Limite da sequência atingido'; end if;
  code:=private.epi_code(n+1);
 end if;
 perform public.import_items(jsonb_build_array(p_row||jsonb_build_object('codigo',code)));
 select id into result from public.items where sku=code;
 insert into private.epi_create_requests values(p_request,auth.uid(),p_row,p_manual,result);
 return jsonb_build_object('id',result,'codigo',code);
end $$;
revoke all on function public.epi_code_status(),public.create_epi(jsonb,boolean,uuid) from public,anon;
grant execute on function public.epi_code_status(),public.create_epi(jsonb,boolean,uuid) to authenticated;
commit;
