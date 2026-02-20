-- Usage:
--   Replace admin@your-company.com and run in Supabase SQL editor.
--
-- This upserts an admin role row for the given email.

insert into public.user_roles (user_email, role)
values ('admin@your-company.com', 'admin')
on conflict (user_email)
do update set
  role = excluded.role,
  updated_at = timezone('utc', now());
