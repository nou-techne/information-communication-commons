export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          api_key_hash: string | null
          capabilities: string[] | null
          created_at: string
          id: string
          name: string
          participant_id: string | null
          type: Database["public"]["Enums"]["agent_type"]
        }
        Insert: {
          api_key_hash?: string | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          name: string
          participant_id?: string | null
          type?: Database["public"]["Enums"]["agent_type"]
        }
        Update: {
          api_key_hash?: string | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          name?: string
          participant_id?: string | null
          type?: Database["public"]["Enums"]["agent_type"]
        }
        Relationships: [
          {
            foreignKeyName: "agents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_dimensions: {
        Row: {
          artifact_id: string
          created_at: string
          dimension: Database["public"]["Enums"]["dimension_type"]
          id: string
          key: string
          value: string
          weight: number | null
        }
        Insert: {
          artifact_id: string
          created_at?: string
          dimension: Database["public"]["Enums"]["dimension_type"]
          id?: string
          key: string
          value: string
          weight?: number | null
        }
        Update: {
          artifact_id?: string
          created_at?: string
          dimension?: Database["public"]["Enums"]["dimension_type"]
          id?: string
          key?: string
          value?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_dimensions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
        ]
      }
      artifact_participants: {
        Row: {
          artifact_id: string
          created_at: string
          participant_id: string
          role: Database["public"]["Enums"]["participant_artifact_role"]
        }
        Insert: {
          artifact_id: string
          created_at?: string
          participant_id: string
          role?: Database["public"]["Enums"]["participant_artifact_role"]
        }
        Update: {
          artifact_id?: string
          created_at?: string
          participant_id?: string
          role?: Database["public"]["Enums"]["participant_artifact_role"]
        }
        Relationships: [
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_participants_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_agent: string | null
          description: string | null
          from_artifact_id: string
          id: string
          to_artifact_id: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          description?: string | null
          from_artifact_id: string
          id?: string
          to_artifact_id: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          description?: string | null
          from_artifact_id?: string
          id?: string
          to_artifact_id?: string
          type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "artifact_relationships_created_by_agent_fkey"
            columns: ["created_by_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_relationships_from_artifact_id_fkey"
            columns: ["from_artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_relationships_to_artifact_id_fkey"
            columns: ["to_artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
        ]
      }
      artifact_sessions: {
        Row: {
          artifact_id: string
          role: Database["public"]["Enums"]["artifact_session_role"]
          session_id: string
        }
        Insert: {
          artifact_id: string
          role?: Database["public"]["Enums"]["artifact_session_role"]
          session_id: string
        }
        Update: {
          artifact_id?: string
          role?: Database["public"]["Enums"]["artifact_session_role"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_sessions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_tags: {
        Row: {
          artifact_id: string
          tag_id: string
        }
        Insert: {
          artifact_id: string
          tag_id: string
        }
        Update: {
          artifact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_tags_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_tents: {
        Row: {
          artifact_id: string
          tent_id: string
        }
        Insert: {
          artifact_id: string
          tent_id: string
        }
        Update: {
          artifact_id?: string
          tent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_tents_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "artifact_tents_tent_id_fkey"
            columns: ["tent_id"]
            isOneToOne: false
            referencedRelation: "tents"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          agent_type: string | null
          body: string | null
          created_at: string
          created_by: string | null
          created_by_agent: string | null
          deleted_at: string | null
          id: string
          origin_convergence_id: string | null
          origin_session_id: string | null
          rea_role: string | null
          search_vector: unknown
          state: Database["public"]["Enums"]["artifact_state"]
          steward_id: string | null
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["artifact_type"]
          updated_at: string
        }
        Insert: {
          agent_type?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          deleted_at?: string | null
          id?: string
          origin_convergence_id?: string | null
          origin_session_id?: string | null
          rea_role?: string | null
          search_vector?: unknown
          state?: Database["public"]["Enums"]["artifact_state"]
          steward_id?: string | null
          summary?: string | null
          title: string
          type: Database["public"]["Enums"]["artifact_type"]
          updated_at?: string
        }
        Update: {
          agent_type?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          deleted_at?: string | null
          id?: string
          origin_convergence_id?: string | null
          origin_session_id?: string | null
          rea_role?: string | null
          search_vector?: unknown
          state?: Database["public"]["Enums"]["artifact_state"]
          steward_id?: string | null
          summary?: string | null
          title?: string
          type?: Database["public"]["Enums"]["artifact_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_created_by_agent_fkey"
            columns: ["created_by_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_convergence_id_fkey"
            columns: ["origin_convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_session_id_fkey"
            columns: ["origin_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      bioregions: {
        Row: {
          created_at: string
          description: string | null
          elevation_ft: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          watershed: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          elevation_ft?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          watershed?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          elevation_ft?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          watershed?: string | null
        }
        Relationships: []
      }
      commitments: {
        Row: {
          artifact_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          last_reminded_at: string | null
          participant_id: string
          progress_notes: Json[] | null
          reminder_count: number | null
          status: Database["public"]["Enums"]["commitment_status"]
          updated_at: string
        }
        Insert: {
          artifact_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          last_reminded_at?: string | null
          participant_id: string
          progress_notes?: Json[] | null
          reminder_count?: number | null
          status?: Database["public"]["Enums"]["commitment_status"]
          updated_at?: string
        }
        Update: {
          artifact_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          last_reminded_at?: string | null
          participant_id?: string
          progress_notes?: Json[] | null
          reminder_count?: number | null
          status?: Database["public"]["Enums"]["commitment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "commitments_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "commitments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          content: string
          convergence_id: string | null
          created_at: string | null
          errors: Json | null
          extraction: Json | null
          id: string
          parent_contribution_id: string | null
          participant_id: string | null
          processed_at: string | null
          search_vector: unknown
          status: string | null
        }
        Insert: {
          content: string
          convergence_id?: string | null
          created_at?: string | null
          errors?: Json | null
          extraction?: Json | null
          id?: string
          parent_contribution_id?: string | null
          participant_id?: string | null
          processed_at?: string | null
          search_vector?: unknown
          status?: string | null
        }
        Update: {
          content?: string
          convergence_id?: string | null
          created_at?: string | null
          errors?: Json | null
          extraction?: Json | null
          id?: string
          parent_contribution_id?: string | null
          participant_id?: string | null
          processed_at?: string | null
          search_vector?: unknown
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_parent_contribution_id_fkey"
            columns: ["parent_contribution_id"]
            isOneToOne: false
            referencedRelation: "contribution_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_parent_contribution_id_fkey"
            columns: ["parent_contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      convergence_participants: {
        Row: {
          convergence_id: string
          participant_id: string
          registered_at: string
          state: Database["public"]["Enums"]["attendance_state"]
        }
        Insert: {
          convergence_id: string
          participant_id: string
          registered_at?: string
          state?: Database["public"]["Enums"]["attendance_state"]
        }
        Update: {
          convergence_id?: string
          participant_id?: string
          registered_at?: string
          state?: Database["public"]["Enums"]["attendance_state"]
        }
        Relationships: [
          {
            foreignKeyName: "convergence_participants_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convergence_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convergence_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      convergence_templates: {
        Row: {
          created_at: string
          description: string
          dimensions: Json
          id: string
          logo_accent: string | null
          name: string
          tagline: string | null
          theme: Json
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          dimensions?: Json
          id?: string
          logo_accent?: string | null
          name: string
          tagline?: string | null
          theme?: Json
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          dimensions?: Json
          id?: string
          logo_accent?: string | null
          name?: string
          tagline?: string | null
          theme?: Json
          type?: string
        }
        Relationships: []
      }
      convergences: {
        Row: {
          bioregion_id: string | null
          created_at: string
          date_end: string | null
          date_start: string | null
          description: string | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          location: string | null
          logo_accent: string | null
          logo_text: string | null
          name: string
          state: Database["public"]["Enums"]["convergence_state"]
          tagline: string | null
          theme_bg: string | null
          theme_border: string | null
          theme_primary: string | null
          theme_surface: string | null
          updated_at: string
        }
        Insert: {
          bioregion_id?: string | null
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_accent?: string | null
          logo_text?: string | null
          name: string
          state?: Database["public"]["Enums"]["convergence_state"]
          tagline?: string | null
          theme_bg?: string | null
          theme_border?: string | null
          theme_primary?: string | null
          theme_surface?: string | null
          updated_at?: string
        }
        Update: {
          bioregion_id?: string | null
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_accent?: string | null
          logo_text?: string | null
          name?: string
          state?: Database["public"]["Enums"]["convergence_state"]
          tagline?: string | null
          theme_bg?: string | null
          theme_border?: string | null
          theme_primary?: string | null
          theme_surface?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convergences_bioregion_id_fkey"
            columns: ["bioregion_id"]
            isOneToOne: false
            referencedRelation: "bioregions"
            referencedColumns: ["id"]
          },
        ]
      }
      coordination_interests: {
        Row: {
          artifact_id: string
          created_at: string
          id: string
          note: string | null
          participant_id: string
        }
        Insert: {
          artifact_id: string
          created_at?: string
          id?: string
          note?: string | null
          participant_id: string
        }
        Update: {
          artifact_id?: string
          created_at?: string
          id?: string
          note?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "active_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifact_graph"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "chatham_house_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_hotspots"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "coordination_interests_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "coordination_matches"
            referencedColumns: ["artifact_id"]
          },
          {
            foreignKeyName: "coordination_interests_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordination_interests_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_id: string | null
          actor_type: string
          convergence_id: string | null
          created_at: string
          data: Json
          entity_id: string
          entity_type: string
          id: string
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          convergence_id?: string | null
          created_at?: string
          data?: Json
          entity_id: string
          entity_type: string
          id?: string
          type: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          convergence_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "events_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_connections: {
        Row: {
          context: string | null
          convergence_id: string | null
          created_at: string
          id: string
          participant_a_id: string
          participant_b_id: string
          session_id: string | null
        }
        Insert: {
          context?: string | null
          convergence_id?: string | null
          created_at?: string
          id?: string
          participant_a_id: string
          participant_b_id: string
          session_id?: string | null
        }
        Update: {
          context?: string | null
          convergence_id?: string | null
          created_at?: string
          id?: string
          participant_a_id?: string
          participant_b_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_connections_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_connections_participant_a_id_fkey"
            columns: ["participant_a_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_connections_participant_a_id_fkey"
            columns: ["participant_a_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_connections_participant_b_id_fkey"
            columns: ["participant_b_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_connections_participant_b_id_fkey"
            columns: ["participant_b_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_connections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          affiliation: string | null
          auth_user_id: string | null
          background: string | null
          bio: string | null
          capabilities: string[] | null
          consent_recording: boolean | null
          created_at: string
          email: string | null
          experience: string[] | null
          id: string
          interests: string[] | null
          location: string | null
          looking_for: string[] | null
          name: string
          notification_prefs: Json | null
          offering: string[] | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          auth_user_id?: string | null
          background?: string | null
          bio?: string | null
          capabilities?: string[] | null
          consent_recording?: boolean | null
          created_at?: string
          email?: string | null
          experience?: string[] | null
          id?: string
          interests?: string[] | null
          location?: string | null
          looking_for?: string[] | null
          name: string
          notification_prefs?: Json | null
          offering?: string[] | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          auth_user_id?: string | null
          background?: string | null
          bio?: string | null
          capabilities?: string[] | null
          consent_recording?: boolean | null
          created_at?: string
          email?: string | null
          experience?: string[] | null
          id?: string
          interests?: string[] | null
          location?: string | null
          looking_for?: string[] | null
          name?: string
          notification_prefs?: Json | null
          offering?: string[] | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          participant_id: string
          role: string | null
          session_id: string
        }
        Insert: {
          participant_id: string
          role?: string | null
          session_id: string
        }
        Update: {
          participant_id?: string
          role?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          chatham_house: boolean | null
          convergence_id: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          recording_url: string | null
          time_end: string | null
          time_start: string | null
          title: string
          transcript_url: string | null
        }
        Insert: {
          chatham_house?: boolean | null
          convergence_id: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          recording_url?: string | null
          time_end?: string | null
          time_start?: string | null
          title: string
          transcript_url?: string | null
        }
        Update: {
          chatham_house?: boolean | null
          convergence_id?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          recording_url?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string
          transcript_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_artifacts: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          created_by_agent: string | null
          deleted_at: string | null
          id: string | null
          origin_convergence_id: string | null
          origin_session_id: string | null
          search_vector: unknown
          state: Database["public"]["Enums"]["artifact_state"] | null
          steward_id: string | null
          summary: string | null
          title: string | null
          type: Database["public"]["Enums"]["artifact_type"] | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_agent?: string | null
          deleted_at?: string | null
          id?: string | null
          origin_convergence_id?: string | null
          origin_session_id?: string | null
          search_vector?: unknown
          state?: Database["public"]["Enums"]["artifact_state"] | null
          steward_id?: string | null
          summary?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["artifact_type"] | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_agent?: string | null
          deleted_at?: string | null
          id?: string | null
          origin_convergence_id?: string | null
          origin_session_id?: string | null
          search_vector?: unknown
          state?: Database["public"]["Enums"]["artifact_state"] | null
          steward_id?: string | null
          summary?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["artifact_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_created_by_agent_fkey"
            columns: ["created_by_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_convergence_id_fkey"
            columns: ["origin_convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_session_id_fkey"
            columns: ["origin_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_graph: {
        Row: {
          body: string | null
          connection_count: number | null
          created_at: string | null
          created_by: string | null
          created_by_agent: string | null
          id: string | null
          origin_convergence_id: string | null
          origin_session_id: string | null
          participant_count: number | null
          search_vector: unknown
          state: Database["public"]["Enums"]["artifact_state"] | null
          steward_id: string | null
          summary: string | null
          tag_names: string[] | null
          tent_names: string[] | null
          title: string | null
          type: Database["public"]["Enums"]["artifact_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_created_by_agent_fkey"
            columns: ["created_by_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_convergence_id_fkey"
            columns: ["origin_convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_session_id_fkey"
            columns: ["origin_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_steward_id_fkey"
            columns: ["steward_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      chatham_house_artifacts: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          created_by_agent: string | null
          id: string | null
          is_agent_content: boolean | null
          origin_convergence_id: string | null
          origin_session_id: string | null
          search_vector: unknown
          state: Database["public"]["Enums"]["artifact_state"] | null
          steward_id: string | null
          summary: string | null
          title: string | null
          type: Database["public"]["Enums"]["artifact_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_created_by_agent_fkey"
            columns: ["created_by_agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_convergence_id_fkey"
            columns: ["origin_convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_origin_session_id_fkey"
            columns: ["origin_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_feed: {
        Row: {
          content: string | null
          convergence_id: string | null
          convergence_name: string | null
          created_at: string | null
          errors: Json | null
          id: string | null
          parent_contribution_id: string | null
          participant_id: string | null
          participant_name: string | null
          reply_count: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_parent_contribution_id_fkey"
            columns: ["parent_contribution_id"]
            isOneToOne: false
            referencedRelation: "contribution_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_parent_contribution_id_fkey"
            columns: ["parent_contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participant_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      coordination_hotspots: {
        Row: {
          artifact_id: string | null
          interest_count: number | null
          interested_participants: string[] | null
          rea_role: string | null
          summary: string | null
          title: string | null
          type: Database["public"]["Enums"]["artifact_type"] | null
        }
        Relationships: []
      }
      coordination_matches: {
        Row: {
          artifact_id: string | null
          participant_a: string | null
          participant_b: string | null
          shared_interest: string | null
        }
        Relationships: []
      }
      extraction_health_metrics: {
        Row: {
          avg_processing_seconds: number | null
          contributions_last_24h: number | null
          contributions_last_hour: number | null
          failed: number | null
          failed_24h: number | null
          failure_rate_pct: number | null
          last_processed_at: string | null
          pending: number | null
          processing: number | null
          success_rate_24h_pct: number | null
          success_rate_pct: number | null
          successful: number | null
          successful_24h: number | null
        }
        Relationships: []
      }
      participant_activity: {
        Row: {
          affiliation: string | null
          artifacts_authored: number | null
          artifacts_stewarding: number | null
          auth_user_id: string | null
          bio: string | null
          completed_commitments: number | null
          connections_made: number | null
          consent_recording: boolean | null
          created_at: string | null
          email: string | null
          id: string | null
          interests: string[] | null
          name: string | null
          notification_prefs: Json | null
          open_commitments: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      recent_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_type: string | null
          convergence_id: string | null
          created_at: string | null
          data: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          type: Database["public"]["Enums"]["event_type"] | null
        }
        Insert: {
          actor_id?: string | null
          actor_name?: never
          actor_type?: string | null
          convergence_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_name?: never
          entity_type?: string | null
          id?: string | null
          type?: Database["public"]["Enums"]["event_type"] | null
        }
        Update: {
          actor_id?: string | null
          actor_name?: never
          actor_type?: string | null
          convergence_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_name?: never
          entity_type?: string | null
          id?: string | null
          type?: Database["public"]["Enums"]["event_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "convergences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_artifact: {
        Args: {
          p_convergence_id: string
          p_created_by?: string
          p_created_by_agent?: string
          p_dimensions?: Json
          p_session_id?: string
          p_steward_id?: string
          p_summary: string
          p_tags?: string[]
          p_title: string
          p_type: Database["public"]["Enums"]["artifact_type"]
        }
        Returns: string
      }
      create_convergence_from_template: {
        Args: {
          p_end_date: string
          p_location?: string
          p_name: string
          p_slug: string
          p_start_date: string
          p_template_id: string
        }
        Returns: string
      }
      current_participant_id: { Args: never; Returns: string }
      evolve_artifact: {
        Args: {
          p_actor_id: string
          p_actor_type?: string
          p_artifact_id: string
          p_new_state: Database["public"]["Enums"]["artifact_state"]
          p_notes?: string
        }
        Returns: undefined
      }
      export_convergence_jsonld: {
        Args: { p_convergence_id?: string }
        Returns: Json
      }
      get_active_convergence: {
        Args: never
        Returns: {
          description: string
          dimensions: Json
          id: string
          logo_accent: string
          logo_text: string
          name: string
          tagline: string
          theme_bg: string
          theme_border: string
          theme_primary: string
          theme_surface: string
        }[]
      }
      get_contribution_thread: {
        Args: { p_contribution_id: string }
        Returns: {
          content: string
          created_at: string
          depth: number
          id: string
          participant_id: string
          participant_name: string
          status: string
        }[]
      }
      get_recent_artifacts: {
        Args: { p_convergence_id: string; p_hours?: number }
        Returns: {
          created_at: string
          id: string
          summary: string
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["artifact_type"]
        }[]
      }
      get_recent_extraction_errors: {
        Args: { limit_count?: number }
        Returns: {
          content_preview: string
          contribution_id: string
          created_at: string
          errors: Json
        }[]
      }
      get_thread_count: { Args: { p_contribution_id: string }; Returns: number }
      get_weighted_dimension_distribution: {
        Args: { p_convergence_id?: string }
        Returns: {
          artifact_count: number
          avg_weight: number
          dimension_key: string
          total_weight: number
        }[]
      }
      ingest_extraction: {
        Args: {
          p_actor_id?: string
          p_actor_type?: string
          p_convergence_id: string
          p_extraction?: Json
          p_session_title?: string
        }
        Returns: Json
      }
      link_artifacts: {
        Args: {
          p_actor_id: string
          p_actor_type?: string
          p_description?: string
          p_from_id: string
          p_to_id: string
          p_type: Database["public"]["Enums"]["relationship_type"]
        }
        Returns: string
      }
      merge_artifacts: {
        Args: {
          p_merged_summary?: string
          p_merged_title?: string
          p_source_artifact_id: string
          p_target_artifact_id: string
        }
        Returns: Json
      }
      record_commitment: {
        Args: {
          p_artifact_id: string
          p_description: string
          p_due_date?: string
          p_participant_id: string
        }
        Returns: string
      }
      search_artifacts: {
        Args: {
          p_convergence_id?: string
          p_limit?: number
          p_query: string
          p_type?: Database["public"]["Enums"]["artifact_type"]
        }
        Returns: {
          id: string
          rank: number
          state: Database["public"]["Enums"]["artifact_state"]
          summary: string
          title: string
          type: Database["public"]["Enums"]["artifact_type"]
        }[]
      }
      search_content: {
        Args: { query_text: string }
        Returns: {
          created_at: string
          id: string
          rank: number
          result_type: string
          snippet: string
          title: string
        }[]
      }
      submit_observation: {
        Args: {
          p_actor_id: string
          p_actor_type: string
          p_convergence_id?: string
          p_data: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: string
      }
      word_frequencies: {
        Args: { p_participant_id?: string }
        Returns: {
          contributors: number
          count: number
          word: string
        }[]
      }
    }
    Enums: {
      agent_type: "personal" | "collective" | "service"
      artifact_session_role: "discussed_in" | "emerged_from" | "presented_in"
      artifact_state:
        | "seed"
        | "discussed"
        | "proposed"
        | "committed"
        | "active"
        | "completed"
        | "archived"
        | "superseded"
        | "merged"
      artifact_type:
        | "idea"
        | "proposal"
        | "commitment"
        | "pattern"
        | "synthesis"
        | "question"
        | "reflection"
      attendance_state:
        | "registered"
        | "attending"
        | "contributing"
        | "stewarding"
      commitment_status: "made" | "in_progress" | "completed" | "abandoned"
      convergence_state: "announced" | "pre" | "live" | "post" | "archived"
      dimension_type:
        | "temporal"
        | "social"
        | "thematic"
        | "energetic"
        | "spatial"
      event_type:
        | "artifact.created"
        | "artifact.evolved"
        | "artifact.linked"
        | "session.recorded"
        | "session.synthesized"
        | "commitment.made"
        | "commitment.updated"
        | "observation.submitted"
        | "convergence.state_changed"
        | "participant.joined"
        | "extraction.completed"
        | "extraction.failed"
      participant_artifact_role:
        | "author"
        | "contributor"
        | "steward"
        | "interested"
      relationship_type:
        | "builds_on"
        | "extends"
        | "contradicts"
        | "supersedes"
        | "related_to"
        | "synthesizes"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_type: ["personal", "collective", "service"],
      artifact_session_role: ["discussed_in", "emerged_from", "presented_in"],
      artifact_state: [
        "seed",
        "discussed",
        "proposed",
        "committed",
        "active",
        "completed",
        "archived",
        "superseded",
        "merged",
      ],
      artifact_type: [
        "idea",
        "proposal",
        "commitment",
        "pattern",
        "synthesis",
        "question",
        "reflection",
      ],
      attendance_state: [
        "registered",
        "attending",
        "contributing",
        "stewarding",
      ],
      commitment_status: ["made", "in_progress", "completed", "abandoned"],
      convergence_state: ["announced", "pre", "live", "post", "archived"],
      dimension_type: [
        "temporal",
        "social",
        "thematic",
        "energetic",
        "spatial",
      ],
      event_type: [
        "artifact.created",
        "artifact.evolved",
        "artifact.linked",
        "session.recorded",
        "session.synthesized",
        "commitment.made",
        "commitment.updated",
        "observation.submitted",
        "convergence.state_changed",
        "participant.joined",
        "extraction.completed",
        "extraction.failed",
      ],
      participant_artifact_role: [
        "author",
        "contributor",
        "steward",
        "interested",
      ],
      relationship_type: [
        "builds_on",
        "extends",
        "contradicts",
        "supersedes",
        "related_to",
        "synthesizes",
      ],
    },
  },
} as const
