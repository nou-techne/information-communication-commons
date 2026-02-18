-- Fix Security Advisor warning: all public views were SECURITY DEFINER (default).
-- This meant queries bypassed RLS, running with the view creator's permissions.
-- Setting to SECURITY INVOKER ensures RLS policies of the querying user apply.

ALTER VIEW public.coordination_hotspots SET (security_invoker = true);
ALTER VIEW public.active_artifacts SET (security_invoker = true);
ALTER VIEW public.artifact_clusters SET (security_invoker = true);
ALTER VIEW public.artifact_graph SET (security_invoker = true);
ALTER VIEW public.channel_stats SET (security_invoker = true);
ALTER VIEW public.chatham_house_artifacts SET (security_invoker = true);
ALTER VIEW public.contribution_feed SET (security_invoker = true);
ALTER VIEW public.coordination_matches SET (security_invoker = true);
ALTER VIEW public.coordination_signal_summary SET (security_invoker = true);
ALTER VIEW public.extraction_health_metrics SET (security_invoker = true);
ALTER VIEW public.graph_data SET (security_invoker = true);
ALTER VIEW public.participant_activity SET (security_invoker = true);
ALTER VIEW public.public_participants SET (security_invoker = true);
ALTER VIEW public.recent_events SET (security_invoker = true);
ALTER VIEW public.session_stats SET (security_invoker = true);
