-- Fix Security Advisor warning: function_search_path_mutable
-- Functions without an explicit search_path can be exploited via search_path manipulation.
-- Setting search_path = public pins resolution to the public schema.
-- Applied to all public functions.

DO $$
DECLARE
  r RECORD;
  sig TEXT;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND (p.proconfig IS NULL OR NOT p.proconfig @> ARRAY['search_path=public'])
  LOOP
    sig := format('public.%I(%s)', r.proname, r.args);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', sig);
  END LOOP;
END;
$$;
