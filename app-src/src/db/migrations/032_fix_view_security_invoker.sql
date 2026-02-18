-- Fix Security Advisor warning: coordination_hotspots view was SECURITY DEFINER
-- This meant queries bypassed RLS, running with the view creator's permissions.
-- Setting to SECURITY INVOKER ensures RLS policies of the querying user apply.

ALTER VIEW public.coordination_hotspots SET (security_invoker = true);
