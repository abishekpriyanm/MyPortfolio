-- Local development only. Production administrators must be created manually in Supabase Auth.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'admin@portfolio.local',
  extensions.crypt('LocalAdmin123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  'admin@portfolio.local',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"admin@portfolio.local","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do nothing;

insert into public.portfolio_admins (user_id)
values ('11111111-1111-4111-8111-111111111111')
on conflict (singleton) do nothing;

with initial_content as (
  select jsonb_build_object(
    'schemaVersion', 1,
    'about', jsonb_build_object(
      'name', 'Abishek Priyan M',
      'title', 'About Me',
      'description', 'I’m an AI Engineer and Full-Stack Developer focused on turning AI ideas into production-ready systems.',
      'roles', jsonb_build_array('AI Software Engineer', 'Full-Stack Developer', 'Freelancer'),
      'location', 'Chennai, India',
      'email', 'abishek@abishekpriyan.dev',
      'social', jsonb_build_object('github', '', 'linkedin', '', 'twitter', '', 'instagram', '')
    ),
    'career', jsonb_build_array(
      jsonb_build_object(
        'id', 'career-self-employed-freelance-full-stack-developer',
        'position', 'Freelance Full Stack Developer',
        'company', 'Self-Employed',
        'period', 'Dec 2025 - Present',
        'location', 'Chennai, India',
        'description', 'Leading full-stack product delivery for business platforms and public-facing initiatives.',
        'responsibilities', jsonb_build_array(
          'Led a four-member development team building a cloud-kitchen ERP, ordering, and delivery ecosystem.',
          'Collaborated directly with clients to design, develop, and deploy applications.'
        ),
        'technologies', jsonb_build_array('React', 'Next.js', 'Flutter', 'FastAPI', 'Firebase', 'Supabase'),
        'visible', true,
        'order', 0
      )
    ),
    'projects', '[]'::jsonb
  ) as content
)
insert into public.portfolio_versions (state, content, created_by, published_at)
select 'published', content, '11111111-1111-4111-8111-111111111111', now()
from initial_content
where not exists (select 1 from public.portfolio_versions where state = 'published');

insert into public.portfolio_versions (state, content, created_by)
select 'draft', content, created_by
from public.portfolio_versions
where state = 'published'
  and not exists (select 1 from public.portfolio_versions where state = 'draft')
limit 1;
