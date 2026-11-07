begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'portfolio_versions', 'portfolio versions table exists');
select has_table('public', 'media_assets', 'media assets table exists');
select has_table('public', 'resume_versions', 'resume versions table exists');
select ok(
  has_table_privilege('authenticated', 'public.portfolio_versions', 'INSERT'),
  'authenticated users can attempt to create a working draft subject to RLS'
);

set local role anon;
set local request.jwt.claims = '{"role":"anon","aal":"aal1"}';
select is(
  (select count(*)::integer from public.portfolio_versions),
  1,
  'anonymous callers see only the published portfolio'
);
select is(
  (select count(*)::integer from public.resume_versions),
  0,
  'anonymous callers do not see inactive resumes'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}';
select is(
  (select count(*)::integer from public.portfolio_versions),
  1,
  'allowlisted users without MFA still see only published content'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}';
select is(
  (select count(*)::integer from public.portfolio_versions),
  2,
  'allowlisted aal2 administrators see published and draft versions'
);
select ok((select public.is_portfolio_admin()), 'allowlisted aal2 session is an administrator');

update public.portfolio_versions
set content = jsonb_set(
  content,
  '{projects}',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'optional-case-study',
      'slug', 'optional-case-study',
      'title', 'Optional case study',
      'visible', true,
      'caseStudyEnabled', false,
      'caseStudy', jsonb_build_object(
        'problem', '',
        'system', '',
        'role', '',
        'engineering', '',
        'outcome', '',
        'status', '',
        'limitations', ''
      )
    )
  )
)
where state = 'draft';

select lives_ok(
  $$
    select public.publish_portfolio(
      (select id from public.portfolio_versions where state = 'draft'),
      (select updated_at from public.portfolio_versions where state = 'draft')
    )
  $$,
  'a visible project with its case study disabled can publish'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal2"}';
select is(
  (select count(*)::integer from public.portfolio_versions),
  1,
  'a different authenticated user cannot see the draft'
);
reset role;

select * from finish();
rollback;
