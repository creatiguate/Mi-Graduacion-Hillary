-- Aumentar el límite para el evento sin quitar la protección básica contra abuso.
create or replace function public.reserve_graduation_upload_slot(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare recent_count integer;
begin
  if p_ip_hash is null or length(p_ip_hash) <> 64 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  select count(*) into recent_count
  from public.graduation_upload_attempts
  where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
  if recent_count >= 50 then return false; end if;
  insert into public.graduation_upload_attempts(ip_hash) values (p_ip_hash);
  return true;
end;
$$;
revoke all on function public.reserve_graduation_upload_slot(text) from public, anon, authenticated;
grant execute on function public.reserve_graduation_upload_slot(text) to service_role;
