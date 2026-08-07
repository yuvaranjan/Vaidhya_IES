-- Project Vaidhya — edge SQLite mirror (services/edge-ai/edge.db)
-- Source: Docs/Project_Vaidhya_Technical_Architecture_v1.md §3.3
--
-- V1: only `sessions` is actually used (session persistence across a restart).
-- The mirror + outbox tables exist now so the phase-2 offline story is a
-- sync worker and nothing else — no schema change under time pressure.

create table if not exists visits (
  visit_id text primary key,
  patient_id text,
  edge_jurisdiction_id text,
  status text not null default 'intake_in_progress',
  identity_unverified_offline integer default 0,
  language text not null default 'en',
  created_at text not null,
  completed_at text
);

create table if not exists vitals_readings (
  reading_id text primary key,
  visit_id text not null,
  type text not null,
  phase text not null,
  value_numeric real,
  value_text text,
  requested_at text,
  entered_at text,
  status text not null default 'entered'
);

create table if not exists diagnostic_reports (
  report_id text primary key,
  visit_id text not null,
  transcript text not null default '[]',
  vitals_snapshot text not null default '[]',
  urgency_tier text not null default '{}',
  chief_complaint text,
  summary_text text,
  generated_at text not null
);

-- Voicebot session state, so a uvicorn restart mid-demo is survivable.
create table if not exists sessions (
  visit_id text primary key,
  payload text not null,          -- JSON dump of the Session object
  updated_at text not null
);

-- Phase 2: every edge write lands here; a worker drains it to Supabase.
create table if not exists outbox (
  id integer primary key autoincrement,
  entity text not null,           -- visits | vitals_readings | diagnostic_reports
  entity_id text not null,
  payload text not null,          -- JSON
  created_at text not null,
  synced_at text
);
create index if not exists idx_outbox_unsynced on outbox (synced_at);
