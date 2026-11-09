begin;
alter table public.profiles add column username text unique check(username ~ '^[a-z][a-z0-9._-]{2,39}$');
alter table public.profiles add column must_change_password boolean not null default false;
alter table public.profiles add column all_categories boolean not null default false;

create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.profiles where id=auth.uid() and active and role='admin' and not must_change_password)
$$;
create or replace function private.can_access(category uuid, writing boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and not p.must_change_password
 and (not writing or p.role in ('admin','operador'))
 and (p.role='admin' or p.all_categories or exists(select 1 from public.category_access a where a.user_id=p.id and a.category_id=category)))
$$;

-- Somente metadados administrativos provisionam o perfil. Usuário não pode
-- retirar a exigência pelo frontend, user_metadata ou UPDATE na tabela.
create function private.provision_login() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.raw_app_meta_data->>'provision_access'='true' then
  insert into public.profiles(id,role,active,username,must_change_password,all_categories)
  values(new.id,new.raw_app_meta_data->>'access_role',coalesce((new.raw_app_meta_data->>'access_active')::boolean,true),
   new.raw_app_meta_data->>'username',coalesce((new.raw_app_meta_data->>'must_change_password')::boolean,true),true);
 end if;
 return new;
end $$;
create trigger provision_login after insert on auth.users for each row execute function private.provision_login();

-- Auth só altera encrypted_password após validar a troca. Nenhum hash é copiado.
create function private.password_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.encrypted_password is distinct from old.encrypted_password and coalesce(new.encrypted_password,'')<>'' then
  update public.profiles set must_change_password=false where id=new.id and must_change_password;
 end if;
 return new;
end $$;
create trigger access_password_changed after update of encrypted_password on auth.users for each row execute function private.password_changed();
revoke all on function private.provision_login(),private.password_changed() from public,anon,authenticated;

create function public.access_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('active',active,'must_change_password',must_change_password,'username',username)
 from public.profiles where id=auth.uid()
$$;
create function public.can_manage_users() returns boolean language sql stable security definer set search_path='' as $$select private.is_admin()$$;
create function public.set_user_access(p_user uuid,p_role text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() or p_user=auth.uid() then raise exception 'Acesso negado ou alteração do próprio perfil'; end if;
 update public.profiles set role=p_role,active=p_active where id=p_user;
 if not found then raise exception 'Usuário inexistente'; end if;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'perfil de usuário atualizado',p_user::text);
end $$;
revoke all on function public.access_status(),public.can_manage_users(),public.set_user_access(uuid,text,boolean) from public,anon;
grant execute on function public.access_status(),public.can_manage_users(),public.set_user_access(uuid,text,boolean) to authenticated;
create or replace function public.deliver_epi(p_item uuid,p_quantity integer,p_reason text,p_request uuid,p_recipient uuid) returns uuid language plpgsql security definer set search_path='' as $$
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
 select coalesce(p.username,u.email) into email from auth.users u join public.profiles p on p.id=u.id where u.id=auth.uid();
 insert into public.deliveries values(result,recipient.id,recipient.full_name,recipient.document_type||' ••••'||right(recipient.document_number,4),recipient.sector,coalesce(email,auth.uid()::text),coalesce(email,auth.uid()::text),equipment.name,equipment.sku,equipment.unit);
 insert into public.audit(actor,action,record_id) values(auth.uid(),'requisição de entrega criada',result::text);
 return result;
end $$;


commit;
