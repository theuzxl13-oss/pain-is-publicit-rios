-- =============================================================================
-- Storage: buckets e políticas.
--   panel-images : público para leitura; caminho "<panel_id>/<arquivo>"; só o dono escreve.
--   avatars      : público para leitura; caminho "<user_id>/<arquivo>".
--   private-docs : privado (comprovantes, contratos em PDF); acesso só pelo servidor.
-- Limites de tamanho e tipo são aplicados pelo Supabase Storage e revalidados no servidor.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('panel-images', 'panel-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('private-docs', 'private-docs', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "panel images: owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'panel-images'
    and exists (
      select 1 from public.panels p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = (select auth.uid())
        and p.status <> 'suspended'
    )
  );

create policy "panel images: owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'panel-images'
    and exists (
      select 1 from public.panels p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = (select auth.uid())
    )
  );

create policy "panel images: owner or admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'panel-images'
    and (
      (select public.is_admin())
      or exists (
        select 1 from public.panels p
        where p.id::text = (storage.foldername(name))[1]
          and p.owner_id = (select auth.uid())
      )
    )
  );

create policy "avatars: own folder write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: own folder update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
