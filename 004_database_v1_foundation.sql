-- 004_database_v1_foundation.sql
-- Organizational Knowledge & Cognitive Data Foundation
-- Additive migration. runtime_state remains untouched until cutover.

create extension if not exists pg_trgm;

-- Extend existing documents table without breaking current runtime.
alter table if exists documents add column if not exists document_class text;
alter table if exists documents add column if not exists document_type text;
alter table if exists documents add column if not exists issuer text;
alter table if exists documents add column if not exists issued_at date;
alter table if exists documents add column if not exists valid_until date;
alter table if exists documents add column if not exists validity_status text default 'unknown';
alter table if exists documents add column if not exists organizational_level text;
alter table if exists documents add column if not exists organizational_unit_ref text;
alter table if exists documents add column if not exists organizational_unit_name text;
alter table if exists documents add column if not exists subject_area text;
alter table if exists documents add column if not exists source_file_name text;
alter table if exists documents add column if not exists normalized_ref text;
alter table if exists documents add column if not exists artifact_ref text;
alter table if exists documents add column if not exists exact_duplicate_of text;

create index if not exists idx_documents_org_class on documents(organization_id, document_class);
create index if not exists idx_documents_org_validity on documents(organization_id, validity_status);
create index if not exists idx_documents_org_issued_at on documents(organization_id, issued_at desc);
create index if not exists idx_documents_title_trgm on documents using gin (title gin_trgm_ops);
create index if not exists idx_documents_issuer_trgm on documents using gin (issuer gin_trgm_ops);
create index if not exists idx_documents_subject_trgm on documents using gin (subject_area gin_trgm_ops);

create table if not exists document_versions (
  id text primary key,
  organization_id text not null,
  document_ref text not null references documents(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  title text,
  content_hash text,
  status text not null default 'registered',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by text,
  unique(document_ref, version_no)
);
create index if not exists idx_document_versions_org_doc
  on document_versions(organization_id, document_ref, version_no desc);

create table if not exists document_artifacts (
  id text primary key,
  organization_id text not null,
  document_ref text not null references documents(id) on delete cascade,
  version_no integer not null default 1,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  checksum_sha256 text not null,
  storage_provider text,
  object_key text,
  storage_payload jsonb not null default '{}'::jsonb,
  status text not null default 'committed',
  reused_from_artifact_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_document_artifacts_org_doc
  on document_artifacts(organization_id, document_ref);
create index if not exists idx_document_artifacts_checksum
  on document_artifacts(organization_id, checksum_sha256);

create table if not exists document_texts (
  id text primary key,
  organization_id text not null,
  document_ref text not null references documents(id) on delete cascade,
  version_no integer not null default 1,
  language text,
  extraction_method text,
  extraction_status text not null default 'ready',
  extraction_quality numeric(5,4),
  character_quality numeric(5,4),
  text_coverage numeric(5,4),
  layout_confidence numeric(5,4),
  content_hash text,
  text_content text not null,
  structure jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as
    (to_tsvector('simple', coalesce(text_content,''))) stored,
  created_at timestamptz not null default now(),
  unique(document_ref, version_no)
);
create index if not exists idx_document_texts_org_doc
  on document_texts(organization_id, document_ref);
create index if not exists idx_document_texts_search
  on document_texts using gin(search_vector);
create index if not exists idx_document_texts_trgm
  on document_texts using gin(text_content gin_trgm_ops);

create table if not exists document_text_units (
  id text primary key,
  organization_id text not null,
  document_ref text not null references documents(id) on delete cascade,
  document_text_ref text not null references document_texts(id) on delete cascade,
  unit_index integer not null,
  unit_kind text not null,
  page_no integer,
  paragraph_no integer,
  slide_no integer,
  sheet_no integer,
  cell_ref text,
  text_content text not null,
  location_pointer jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as
    (to_tsvector('simple', coalesce(text_content,''))) stored,
  unique(document_text_ref, unit_index)
);
create index if not exists idx_document_text_units_org_doc
  on document_text_units(organization_id, document_ref);
create index if not exists idx_document_text_units_search
  on document_text_units using gin(search_vector);
create index if not exists idx_document_text_units_trgm
  on document_text_units using gin(text_content gin_trgm_ops);

create table if not exists document_relations (
  id text primary key,
  organization_id text not null,
  source_document_ref text not null references documents(id) on delete cascade,
  target_document_ref text not null references documents(id) on delete cascade,
  relation_type text not null,
  direction text,
  confidence numeric(5,4),
  evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_document_relations_source
  on document_relations(organization_id, source_document_ref);
create index if not exists idx_document_relations_target
  on document_relations(organization_id, target_document_ref);

create table if not exists extraction_jobs (
  id text primary key,
  organization_id text not null,
  document_ref text not null references documents(id) on delete cascade,
  artifact_ref text,
  status text not null,
  provider text,
  method text,
  quality jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_extraction_jobs_org_doc
  on extraction_jobs(organization_id, document_ref, created_at desc);

create table if not exists cognitive_entities (
  id text primary key,
  organization_id text not null,
  entity_type text not null,
  title text not null,
  status text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists idx_cognitive_entities_org_type
  on cognitive_entities(organization_id, entity_type);

create table if not exists cognitive_relations (
  id text primary key,
  organization_id text not null,
  source_ref text not null,
  target_ref text not null,
  relation_family text not null,
  relation_type text not null,
  direction text,
  effect numeric,
  confidence numeric(5,4),
  time_window jsonb,
  conditions jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  provenance_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_reviewed_at timestamptz
);
create index if not exists idx_cognitive_relations_source
  on cognitive_relations(organization_id, source_ref);
create index if not exists idx_cognitive_relations_target
  on cognitive_relations(organization_id, target_ref);
create index if not exists idx_cognitive_relations_family
  on cognitive_relations(organization_id, relation_family, relation_type);

create or replace view document_bank_search_v1 as
select
  d.id,
  d.organization_id,
  d.title,
  d.document_class,
  d.document_type,
  d.issuer,
  d.subject_area,
  d.issued_at,
  d.valid_until,
  d.validity_status,
  d.classification,
  d.organizational_unit_ref,
  d.organizational_unit_name,
  d.version,
  d.created_at,
  dt.id as document_text_ref,
  dt.language,
  dt.extraction_method,
  dt.extraction_quality,
  dt.text_content
from documents d
left join document_texts dt
  on dt.document_ref=d.id and dt.version_no=d.version;

comment on table document_texts is
'Canonical extracted text per document version. Search and cognitive analysis must depend on this durable layer, not raw artifact bytes.';

comment on table document_text_units is
'Addressable evidence units for citation, RAG, provenance and cognitive reasoning.';

comment on table cognitive_relations is
'Evidence-bearing many-to-many cognitive graph relation foundation.';
