begin;
-- Movimentações mantêm o texto do motivo no momento do registro.
-- Estas operações alteram somente o catálogo para futuras seleções.
create function public.update_reason(p_reason uuid,p_name text,p_guidance text default '') returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Somente administrador com MFA pode editar motivos'; end if;
 update public.movement_reasons set name=regexp_replace(trim(p_name),'\s+',' ','g'),guidance=trim(coalesce(p_guidance,'')) where id=p_reason;
 if not found then raise exception 'Motivo não encontrado'; end if;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'motivo editado',p_reason::text);
end $$;
create function public.delete_reason(p_reason uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Somente administrador com MFA pode excluir motivos'; end if;
 delete from public.movement_reasons where id=p_reason;
 if not found then raise exception 'Motivo não encontrado'; end if;
 insert into public.audit(actor,action,record_id) values(auth.uid(),'motivo excluído',p_reason::text);
end $$;
revoke all on function public.update_reason(uuid,text,text),public.delete_reason(uuid) from public,anon;
grant execute on function public.update_reason(uuid,text,text),public.delete_reason(uuid) to authenticated;
commit;
