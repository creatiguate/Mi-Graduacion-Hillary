-- Admitir fotos optimizadas de alta calidad de hasta 12 MB.
update storage.buckets
set file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg']
where id = 'graduation-photos';
