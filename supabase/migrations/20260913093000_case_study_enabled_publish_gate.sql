create or replace function public.publish_portfolio(
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
      and coalesce((project ->> 'caseStudyEnabled')::boolean, false)
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
    raise exception 'visible projects with enabled case studies require complete case studies' using errcode = '22023';
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

revoke execute on function public.publish_portfolio(uuid, timestamptz) from public, anon;
grant execute on function public.publish_portfolio(uuid, timestamptz) to authenticated;
