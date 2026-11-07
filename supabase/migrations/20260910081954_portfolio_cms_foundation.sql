create extension if not exists pgcrypto with schema extensions;

create type public.portfolio_version_state as enum ('draft', 'published', 'archived');
create type public.portfolio_media_kind as enum ('project_cover', 'project_gallery');

create table public.portfolio_admins (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.portfolio_versions (
  id uuid primary key default gen_random_uuid(),
  version bigint generated always as identity unique,
  state public.portfolio_version_state not null,
  content jsonb not null check (
    jsonb_typeof(content) = 'object'
    and content ->> 'schemaVersion' = '1'
    and jsonb_typeof(content -> 'about') = 'object'
    and length(trim(content #>> '{about,name}')) between 1 and 120
    and jsonb_typeof(content -> 'career') = 'array'
    and jsonb_typeof(content -> 'projects') = 'array'
  ),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index portfolio_versions_one_draft
  on public.portfolio_versions ((state))
  where state = 'draft';

create unique index portfolio_versions_one_published
  on public.portfolio_versions ((state))
  where state = 'published';

create index portfolio_versions_state_updated_idx
  on public.portfolio_versions (state, updated_at desc);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (length(storage_path) between 3 and 500),
  kind public.portfolio_media_kind not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 12582912),
  width integer not null check (width > 0 and width <= 8000),
  height integer not null check (height > 0 and height <= 8000),
  alt_text text not null check (length(trim(alt_text)) between 3 and 220),
  caption text not null default '' check (length(caption) <= 300),
  is_published boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index media_assets_publication_idx
  on public.media_assets (is_published, created_at desc);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  version bigint generated always as identity unique,
  storage_path text not null unique check (length(storage_path) between 3 and 500),
  original_filename text not null check (length(trim(original_filename)) between 1 and 255),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  checksum_sha256 text check (checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'),
  is_active boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index resume_versions_one_active
  on public.resume_versions ((is_active))
  where is_active;

create index resume_versions_active_created_idx
  on public.resume_versions (is_active, created_at desc);

create function public.touch_portfolio_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolio_versions_touch_updated_at
before update of content on public.portfolio_versions
for each row execute function public.touch_portfolio_updated_at();

alter table public.portfolio_admins enable row level security;
alter table public.portfolio_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.resume_versions enable row level security;

revoke all on table public.portfolio_admins from anon, authenticated;
revoke all on table public.portfolio_versions from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;
revoke all on table public.resume_versions from anon, authenticated;

grant select on table public.portfolio_admins to authenticated;
grant select on table public.portfolio_versions to anon, authenticated;
grant update (content) on table public.portfolio_versions to authenticated;
grant select on table public.media_assets to anon, authenticated;
grant insert on table public.media_assets to authenticated;
grant select on table public.resume_versions to anon, authenticated;
grant insert on table public.resume_versions to authenticated;
grant usage, select on sequence public.portfolio_versions_version_seq to authenticated;
grant usage, select on sequence public.resume_versions_version_seq to authenticated;

create policy "Authenticated users can check their own admin membership"
on public.portfolio_admins
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.is_portfolio_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
    and exists (
      select 1
      from public.portfolio_admins
      where user_id = (select auth.uid())
    );
$$;

revoke execute on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

create policy "Published portfolio is public"
on public.portfolio_versions
for select
to anon, authenticated
using (state = 'published');

create policy "Admin can read portfolio history"
on public.portfolio_versions
for select
to authenticated
using ((select public.is_portfolio_admin()));

create policy "Admin can create portfolio versions"
on public.portfolio_versions
for insert
to authenticated
with check (
  (select public.is_portfolio_admin())
  and created_by = (select auth.uid())
);

create policy "Admin can update portfolio versions"
on public.portfolio_versions
for update
to authenticated
using (
  (select public.is_portfolio_admin())
  and state = 'draft'
)
with check (
  (select public.is_portfolio_admin())
  and state = 'draft'
  and created_by = (select auth.uid())
);

create policy "Published media metadata is public"
on public.media_assets
for select
to anon, authenticated
using (is_published);

create policy "Admin can read media metadata"
on public.media_assets
for select
to authenticated
using ((select public.is_portfolio_admin()));

create policy "Admin can register media"
on public.media_assets
for insert
to authenticated
with check (
  (select public.is_portfolio_admin())
  and created_by = (select auth.uid())
);

create policy "Active resume metadata is public"
on public.resume_versions
for select
to anon, authenticated
using (is_active);

create policy "Admin can read resume history"
on public.resume_versions
for select
to authenticated
using ((select public.is_portfolio_admin()));

create policy "Admin can register resume versions"
on public.resume_versions
for insert
to authenticated
with check (
  (select public.is_portfolio_admin())
  and created_by = (select auth.uid())
);

create function public.portfolio_media_ids(p_content jsonb)
returns setof uuid
language sql
immutable
security invoker
set search_path = ''
as $$
  select distinct asset_id
  from (
    select nullif(project -> 'cover' ->> 'assetId', '')::uuid as asset_id
    from jsonb_array_elements(coalesce(p_content -> 'projects', '[]'::jsonb)) as project

    union all

    select nullif(gallery_item ->> 'assetId', '')::uuid as asset_id
    from jsonb_array_elements(coalesce(p_content -> 'projects', '[]'::jsonb)) as project
    cross join lateral jsonb_array_elements(coalesce(project -> 'gallery', '[]'::jsonb)) as gallery_item
  ) referenced
  where asset_id is not null;
$$;

create function public.publish_portfolio(
  p_draft_id uuid,
  p_expected_updated_at timestamptz
)
returns public.portfolio_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.portfolio_versions;
begin
  if not (select public.is_portfolio_admin()) then
    raise exception 'portfolio admin with aal2 session required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('portfolio-publication'));

  select * into v_draft
  from public.portfolio_versions
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'draft not found' using errcode = 'P0002';
  end if;

  if v_draft.state = 'published' then
    return v_draft;
  end if;

  if v_draft.state <> 'draft' then
    raise exception 'version is not the working draft' using errcode = '22023';
  end if;

  if v_draft.updated_at <> p_expected_updated_at then
    raise exception 'draft changed since it was loaded' using errcode = '40001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_draft.content -> 'projects') as project
    where coalesce((project ->> 'visible')::boolean, false)
      and (
        trim(coalesce(project #>> '{caseStudy,problem}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,system}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,role}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,engineering}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,outcome}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,status}', '')) = ''
        or trim(coalesce(project #>> '{caseStudy,limitations}', '')) = ''
      )
  ) then
    raise exception 'visible projects require a complete case study' using errcode = '22023';
  end if;

  if exists (
    select asset_id from public.portfolio_media_ids(v_draft.content) as asset_id
    except
    select id from public.media_assets
  ) then
    raise exception 'portfolio references missing media assets' using errcode = '23503';
  end if;

  update public.portfolio_versions
  set state = 'archived'
  where state = 'published';

  update public.portfolio_versions
  set state = 'published', published_at = now(), updated_at = now()
  where id = v_draft.id
  returning * into v_draft;

  update public.media_assets set is_published = false where is_published;
  update public.media_assets
  set is_published = true
  where id in (select public.portfolio_media_ids(v_draft.content));

  insert into public.portfolio_versions (state, content, created_by)
  values ('draft', v_draft.content, (select auth.uid()));

  return v_draft;
end;
$$;

create function public.rollback_portfolio(p_version_id uuid)
returns public.portfolio_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.portfolio_versions;
begin
  if not (select public.is_portfolio_admin()) then
    raise exception 'portfolio admin with aal2 session required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('portfolio-publication'));

  select * into v_target
  from public.portfolio_versions
  where id = p_version_id
  for update;

  if not found then
    raise exception 'portfolio version not found' using errcode = 'P0002';
  end if;

  if v_target.state = 'published' then
    return v_target;
  end if;

  if v_target.state <> 'archived' then
    raise exception 'only archived versions can be restored' using errcode = '22023';
  end if;

  update public.portfolio_versions
  set state = 'archived'
  where state in ('published', 'draft');

  update public.portfolio_versions
  set state = 'published', published_at = now(), updated_at = now()
  where id = v_target.id
  returning * into v_target;

  update public.media_assets set is_published = false where is_published;
  update public.media_assets
  set is_published = true
  where id in (select public.portfolio_media_ids(v_target.content));

  insert into public.portfolio_versions (state, content, created_by)
  values ('draft', v_target.content, (select auth.uid()));

  return v_target;
end;
$$;

create function public.activate_resume(p_resume_id uuid)
returns public.resume_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resume public.resume_versions;
begin
  if not (select public.is_portfolio_admin()) then
    raise exception 'portfolio admin with aal2 session required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('portfolio-resume-activation'));

  select * into v_resume
  from public.resume_versions
  where id = p_resume_id
  for update;

  if not found then
    raise exception 'resume version not found' using errcode = 'P0002';
  end if;

  if v_resume.is_active then
    return v_resume;
  end if;

  update public.resume_versions
  set is_active = false
  where is_active;

  update public.resume_versions
  set is_active = true, published_at = now()
  where id = v_resume.id
  returning * into v_resume;

  return v_resume;
end;
$$;

revoke execute on function public.touch_portfolio_updated_at() from public, anon, authenticated;
revoke execute on function public.portfolio_media_ids(jsonb) from public, anon;
grant execute on function public.portfolio_media_ids(jsonb) to authenticated;
revoke execute on function public.publish_portfolio(uuid, timestamptz) from public, anon;
grant execute on function public.publish_portfolio(uuid, timestamptz) to authenticated;
revoke execute on function public.rollback_portfolio(uuid) from public, anon;
grant execute on function public.rollback_portfolio(uuid) to authenticated;
revoke execute on function public.activate_resume(uuid) from public, anon;
grant execute on function public.activate_resume(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-media', 'portfolio-media', false, 12582912, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio-resumes', 'portfolio-resumes', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Published portfolio media can be downloaded"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (
    select 1 from public.media_assets
    where storage_path = name and is_published
  )
);

create policy "Active resume can be downloaded"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'portfolio-resumes'
  and exists (
    select 1 from public.resume_versions
    where storage_path = name and is_active
  )
);

create policy "Admin can read CMS storage"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and (select public.is_portfolio_admin())
);

create policy "Admin can upload CMS storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and (select public.is_portfolio_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Admin can delete owned CMS storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('portfolio-media', 'portfolio-resumes')
  and (select public.is_portfolio_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
