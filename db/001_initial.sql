-- PostgreSQL target schema for durable cloud persistence.
create table if not exists documents (
  id text primary key,
  organization_id text not null,
  title text not null,
  status text not null,
  version integer not null check (version > 0),
  knowledge_zone text not null,
  classification text not null,
  created_at timestamptz not null,
  created_by text not null,
  updated_at timestamptz,
  content_hash text not null,
  content text not null,
  canonical_metadata jsonb not null default '{"topics":[],"claims":[]}'::jsonb
);
create index if not exists idx_documents_org on documents(organization_id);
create table if not exists ai_executions (id text primary key, organization_id text not null, payload jsonb not null, created_at timestamptz not null default now());
create table if not exists candidates (id text primary key, organization_id text not null, document_ref text not null, status text not null, payload jsonb not null, created_at timestamptz not null default now());
create index if not exists idx_candidates_org_doc on candidates(organization_id,document_ref);
create table if not exists audit_records (id text primary key, organization_id text not null, object_ref text not null, action text not null, payload jsonb not null, occurred_at timestamptz not null);
create table if not exists provenance_records (id text primary key, organization_id text not null, target_ref text not null, payload jsonb not null, created_at timestamptz not null);
