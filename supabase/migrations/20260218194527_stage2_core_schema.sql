-- Stage 2 core schema: employees, roles, and import tracking.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

DO $$
BEGIN
  CREATE TYPE public.employee_status AS ENUM ('active', 'leave', 'terminated', 'contractor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'hr_editor', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.import_job_status AS ENUM ('pending', 'running', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email citext NOT NULL UNIQUE,
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  manager_employee_id text,
  status public.employee_status NOT NULL DEFAULT 'active',
  start_date date,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT employees_employee_id_not_blank CHECK (btrim(employee_id) <> ''),
  CONSTRAINT employees_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT employees_email_format CHECK (position('@' IN email::text) > 1),
  CONSTRAINT employees_title_not_blank CHECK (btrim(title) <> ''),
  CONSTRAINT employees_department_not_blank CHECK (btrim(department) <> ''),
  CONSTRAINT employees_location_not_blank CHECK (btrim(location) <> ''),
  CONSTRAINT employees_manager_not_self CHECK (
    manager_employee_id IS NULL OR manager_employee_id <> employee_id
  ),
  CONSTRAINT employees_manager_fkey FOREIGN KEY (manager_employee_id)
    REFERENCES public.employees (employee_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email citext NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_roles_user_email_format CHECK (position('@' IN user_email::text) > 1)
);

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by_email citext NOT NULL,
  status public.import_job_status NOT NULL DEFAULT 'pending',
  source_file_name text,
  report_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  rows_total integer NOT NULL DEFAULT 0,
  rows_created integer NOT NULL DEFAULT 0,
  rows_updated integer NOT NULL DEFAULT 0,
  rows_rejected integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT import_jobs_uploaded_by_email_format CHECK (position('@' IN uploaded_by_email::text) > 1),
  CONSTRAINT import_jobs_rows_total_non_negative CHECK (rows_total >= 0),
  CONSTRAINT import_jobs_rows_created_non_negative CHECK (rows_created >= 0),
  CONSTRAINT import_jobs_rows_updated_non_negative CHECK (rows_updated >= 0),
  CONSTRAINT import_jobs_rows_rejected_non_negative CHECK (rows_rejected >= 0),
  CONSTRAINT import_jobs_finished_after_started CHECK (
    finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at
  )
);

CREATE INDEX IF NOT EXISTS employees_manager_employee_id_idx
  ON public.employees (manager_employee_id);

CREATE INDEX IF NOT EXISTS employees_status_idx
  ON public.employees (status);

CREATE INDEX IF NOT EXISTS employees_department_idx
  ON public.employees (department);

CREATE INDEX IF NOT EXISTS employees_location_idx
  ON public.employees (location);

CREATE INDEX IF NOT EXISTS employees_name_search_idx
  ON public.employees (lower(name));

CREATE INDEX IF NOT EXISTS employees_email_search_idx
  ON public.employees (lower(email::text));

CREATE INDEX IF NOT EXISTS user_roles_role_idx
  ON public.user_roles (role);

CREATE INDEX IF NOT EXISTS import_jobs_status_created_at_idx
  ON public.import_jobs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS import_jobs_uploaded_by_email_idx
  ON public.import_jobs (uploaded_by_email);

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_employees_updated_at ON public.employees;
CREATE TRIGGER set_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER set_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER set_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

commit;
