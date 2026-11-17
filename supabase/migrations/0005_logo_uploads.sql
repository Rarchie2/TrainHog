-- Trainers can upload their own logo. Files live in a "logos" bucket, one
-- folder per business. Anyone can view a logo (clients' phones load it by
-- link); only that business's trainers can add, change or remove files in
-- its folder. Images only, 1 MB max.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Trainers add their logo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.is_trainer(((storage.foldername(name))[1])::uuid));

create policy "Trainers change their logo" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.is_trainer(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'logos' and public.is_trainer(((storage.foldername(name))[1])::uuid));

create policy "Trainers remove their logo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.is_trainer(((storage.foldername(name))[1])::uuid));
