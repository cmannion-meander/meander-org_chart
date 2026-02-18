create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'employee_status') then
    create type public.employee_status as enum ('active', 'leave', 'terminated', 'contractor');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_name') then
    create type public.role_name as enum ('admin', 'hr_editor', 'viewer');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'import_job_status') then
    create type public.import_job_status as enum ('pending', 'running', 'succeeded', 'failed');
  end if;
end $$;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  name text not null,
  email citext not null unique,
  title text not null,
  department text not null,
  location text not null,
  status public.employee_status not null default 'active',
  start_date date,
  manager_employee_id text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.employees
  add constraint employees_manager_employee_id_fkey
  foreign key (manager_employee_id) references public.employees (employee_id)
  on update cascade
  on delete set null
  deferrable initially deferred;

create table if not exists public.user_roles (
  user_email citext primary key,
  role public.role_name not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  uploaded_by citext not null,
  uploaded_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  finished_at timestamptz,
  status public.import_job_status not null default 'pending',
  created_count integer not null default 0,
  updated_count integer not null default 0,
  failed_count integer not null default 0,
  report_json jsonb not null default '{}'::jsonb
);

create index if not exists employees_name_idx on public.employees (name);
create index if not exists employees_department_idx on public.employees (department);
create index if not exists employees_location_idx on public.employees (location);
create index if not exists employees_status_idx on public.employees (status);
create index if not exists employees_manager_employee_id_idx on public.employees (manager_employee_id);
create index if not exists import_jobs_status_idx on public.import_jobs (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_updated_at();
