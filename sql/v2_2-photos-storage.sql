-- Steep v2.2 — photo storage. Run once in the Supabase SQL Editor.
-- Creates a public bucket for tea/vessel photos and restricts writes to each
-- user's own folder. Reads are public (the URL is embedded wherever a photo shows).

insert into storage.buckets (id, name, public)
values ('tea-photos', 'tea-photos', true)
on conflict (id) do nothing;

-- Policies on storage.objects (RLS is already enabled there by Supabase).
do $$
begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='tea-photos read') then
    create policy "tea-photos read" on storage.objects
      for select using ( bucket_id = 'tea-photos' );
  end if;

  if not exists (select 1 from pg_policies where tablename='objects' and policyname='tea-photos insert own') then
    create policy "tea-photos insert own" on storage.objects
      for insert to authenticated
      with check ( bucket_id='tea-photos' and (storage.foldername(name))[1] = auth.uid()::text );
  end if;

  if not exists (select 1 from pg_policies where tablename='objects' and policyname='tea-photos update own') then
    create policy "tea-photos update own" on storage.objects
      for update to authenticated
      using ( bucket_id='tea-photos' and (storage.foldername(name))[1] = auth.uid()::text );
  end if;

  if not exists (select 1 from pg_policies where tablename='objects' and policyname='tea-photos delete own') then
    create policy "tea-photos delete own" on storage.objects
      for delete to authenticated
      using ( bucket_id='tea-photos' and (storage.foldername(name))[1] = auth.uid()::text );
  end if;
end $$;
