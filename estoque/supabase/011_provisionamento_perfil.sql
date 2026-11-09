-- Aplicar após 001–010. Não altera perfis já existentes nem senhas.
begin;
create or replace function private.provision_login() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.raw_app_meta_data->>'provision_access'='true' then
  insert into public.profiles(id,role,active,username,must_change_password,all_categories)
  values(new.id,new.raw_app_meta_data->>'access_role',coalesce((new.raw_app_meta_data->>'access_active')::boolean,true),
   new.raw_app_meta_data->>'username',coalesce((new.raw_app_meta_data->>'must_change_password')::boolean,true),true)
  on conflict(id) do nothing;
 end if;
 return new;
end $$;
-- Auth pode gravar app_metadata em um UPDATE posterior ao INSERT do usuário.
drop trigger if exists provision_login on auth.users;
create trigger provision_login after insert or update of raw_app_meta_data on auth.users
 for each row execute function private.provision_login();
revoke all on function private.provision_login() from public,anon,authenticated;

-- Recuperar somente logins com solicitação administrativa explícita de provisionamento.
insert into public.profiles(id,role,active,username,must_change_password,all_categories)
select u.id,u.raw_app_meta_data->>'access_role',coalesce((u.raw_app_meta_data->>'access_active')::boolean,true),
 u.raw_app_meta_data->>'username',coalesce((u.raw_app_meta_data->>'must_change_password')::boolean,true),true
from auth.users u
where u.raw_app_meta_data->>'provision_access'='true'
and not exists(select 1 from public.profiles p where p.id=u.id)
on conflict(id) do nothing;
notify pgrst, 'reload schema';
commit;
