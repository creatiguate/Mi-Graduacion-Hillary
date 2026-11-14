-- Publicar todas las fotos del evento sin revisión manual.
update public.graduation_photos
set status = 'approved'
where status <> 'approved';

alter table public.graduation_photos
  alter column status set default 'approved';
