-- Aplicar uma vez no SQL Editor de um projeto Supabase novo.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id),
 role text not null check (role in ('admin','operador','leitor')) default 'leitor',
 active boolean not null default true
);
create table public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check (length(trim(name)) between 1 and 80)
);
create table public.category_access (
 user_id uuid references public.profiles(id), category_id uuid references public.categories(id),
 primary key (user_id,category_id)
);
create table public.items (
 id uuid primary key default gen_random_uuid(),
 sku text not null unique check (sku ~ '^[A-Za-z0-9._-]{1,40}$'),
 name text not null check (length(trim(name)) between 1 and 120),
 category_id uuid not null references public.categories(id),
 unit text not null default 'un' check (unit in ('un','par','caixa')),
 minimum integer not null default 0 check (minimum between 0 and 1000000),
 balance integer not null default 0 check (balance between 0 and 100000000),
 created_at timestamptz not null default now()
);
create table public.movements (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 item_id uuid not null references public.items(id),
 kind text not null check (kind in ('entrada','saida')),
 quantity integer not null check (quantity between 1 and 1000000),
 reason text not null check (length(trim(reason)) between 3 and 200),
 actor uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create index on public.items(category_id);
create index on public.movements(item_id,created_at);
create table public.audit (
 id bigint generated always as identity primary key,
 actor uuid, action text not null, record_id text, created_at timestamptz not null default now()
);
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.profiles where id=auth.uid() and active and role='admin')
$$;
create function private.can_access(category uuid, writing boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.active
 and (not writing or p.role in ('admin','operador'))
 and (p.role='admin' or exists(select 1 from public.category_access a where a.user_id=p.id and a.category_id=category)))
$$;
-- Helpers não ficam no schema exposto pela API.
grant usage on schema private to authenticated;
revoke all on function private.is_admin(), private.can_access(uuid,boolean) from public, anon;
grant execute on function private.is_admin(), private.can_access(uuid,boolean) to authenticated;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.category_access enable row level security;
alter table public.items enable row level security;
alter table public.movements enable row level security;
alter table public.audit enable row level security;
revoke all on public.profiles,public.categories,public.category_access,public.items,public.movements,public.audit from anon,authenticated;
grant select on public.profiles,public.categories,public.category_access,public.items,public.movements,public.audit to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or private.is_admin());
create policy categories_read on public.categories for select to authenticated using (private.can_access(id));
create policy access_read on public.category_access for select to authenticated using (user_id=auth.uid() or private.is_admin());
create policy items_read on public.items for select to authenticated using (private.can_access(category_id));
create policy movements_read on public.movements for select to authenticated using (exists(select 1 from public.items i where i.id=item_id and private.can_access(i.category_id)));
create policy audit_read on public.audit for select to authenticated using (private.is_admin());

create function public.create_category(p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if not private.is_admin() then raise exception 'Acesso negado'; end if;
 insert into public.categories(name) values(trim(p_name)) returning id into result;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'categoria criada',result::text);
 return result;
end $$;
create function public.import_items(p_rows jsonb) returns integer language plpgsql security definer set search_path = '' as $$
declare r jsonb; category uuid; result uuid; total integer := 0;
begin
 if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'Envie de 1 a 500 itens'; end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  select id into category from public.categories where name=r->>'categoria';
  if category is null or not private.can_access(category,true) then raise exception 'Categoria inexistente ou acesso negado'; end if;
  if (r->>'minimo') is null or (r->>'nome') is null or (r->>'codigo') is null then raise exception 'Campos obrigatórios ausentes'; end if;
  insert into public.items(sku,name,category_id,unit,minimum) values(r->>'codigo',trim(r->>'nome'),category,r->>'unidade',(r->>'minimo')::integer) returning id into result;
  insert into public.audit(actor,action,record_id) values(auth.uid(),'item criado',result::text);
  total := total+1;
 end loop;
 return total;
end $$;
create function public.move_stock(p_item uuid,p_kind text,p_quantity integer,p_reason text,p_request uuid) returns uuid language plpgsql security definer set search_path = '' as $$
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
create function public.set_access(p_user uuid,p_role text,p_active boolean,p_categories uuid[]) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not private.is_admin() or p_user=auth.uid() then raise exception 'Acesso negado ou alteração do próprio perfil'; end if;
 insert into public.profiles(id,role,active) values(p_user,p_role,p_active)
 on conflict(id) do update set role=excluded.role,active=excluded.active;
 delete from public.category_access where user_id=p_user;
 insert into public.category_access(user_id,category_id) select p_user,unnest(p_categories);
 insert into public.audit(actor,action,record_id) values(auth.uid(),'permissões atualizadas',p_user::text);
end $$;
revoke all on function public.create_category(text),public.import_items(jsonb),public.move_stock(uuid,text,integer,text,uuid),public.set_access(uuid,text,boolean,uuid[]) from public,anon;
grant execute on function public.create_category(text),public.import_items(jsonb),public.move_stock(uuid,text,integer,text,uuid),public.set_access(uuid,text,boolean,uuid[]) to authenticated;
commit;
