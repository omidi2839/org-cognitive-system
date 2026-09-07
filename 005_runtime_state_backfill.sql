-- 005_runtime_state_backfill.sql
-- One-way backfill from the current runtime_state JSONB aggregate into Database V1 tables.
-- IMPORTANT: run only after 001_initial.sql, 002_runtime_state.sql, 003_artifact_foundation.sql
-- and 004_database_v1_foundation.sql.
-- This script is idempotent where practical.

with state as (
  select payload from runtime_state where id='primary'
),
docs as (
  select d
  from state, jsonb_array_elements(coalesce(payload->'documents','[]'::jsonb)) d
)
insert into documents (
  id, organization_id, title, status, version, knowledge_zone, classification,
  created_at, created_by, updated_at, content_hash, content, canonical_metadata,
  document_class, document_type, issuer, issued_at, valid_until, validity_status,
  organizational_level, organizational_unit_ref, organizational_unit_name,
  subject_area, source_file_name, normalized_ref, artifact_ref, exact_duplicate_of
)
select
  d->>'id',
  d->>'organizationId',
  coalesce(nullif(d->>'title',''),'بدون عنوان'),
  coalesce(d->>'status','registered'),
  coalesce((d->>'version')::int,1),
  coalesce(d->>'knowledgeZone','private'),
  coalesce(d->>'classification','internal'),
  coalesce((d->>'createdAt')::timestamptz,now()),
  coalesce(d->>'createdBy','SYSTEM:MIGRATION'),
  nullif(d->>'updatedAt','')::timestamptz,
  coalesce(d->>'contentHash','migration-missing'),
  coalesce(d->>'content',''),
  coalesce(d->'canonicalMetadata','{"topics":[],"claims":[]}'::jsonb),
  d->>'documentClass',
  d->>'documentType',
  d->>'issuer',
  nullif(d->>'issuedAt','')::date,
  nullif(d->>'validUntil','')::date,
  coalesce(d->>'validityStatus','unknown'),
  d->>'organizationalLevel',
  d->>'organizationalUnitRef',
  d->>'organizationalUnitName',
  d->>'subjectArea',
  d->>'sourceFileName',
  d->>'normalizedRef',
  d->>'artifactRef',
  d->>'exactDuplicateOf'
from docs
where d ? 'id'
on conflict (id) do update set
  title=excluded.title,
  status=excluded.status,
  version=excluded.version,
  updated_at=excluded.updated_at,
  document_class=excluded.document_class,
  document_type=excluded.document_type,
  issuer=excluded.issuer,
  issued_at=excluded.issued_at,
  valid_until=excluded.valid_until,
  validity_status=excluded.validity_status,
  organizational_level=excluded.organizational_level,
  organizational_unit_ref=excluded.organizational_unit_ref,
  organizational_unit_name=excluded.organizational_unit_name,
  subject_area=excluded.subject_area,
  source_file_name=excluded.source_file_name,
  normalized_ref=excluded.normalized_ref,
  artifact_ref=excluded.artifact_ref,
  exact_duplicate_of=excluded.exact_duplicate_of;

with state as (
  select payload from runtime_state where id='primary'
),
norms as (
  select n
  from state, jsonb_array_elements(coalesce(payload->'normalizedDocuments','[]'::jsonb)) n
)
insert into document_texts (
  id, organization_id, document_ref, version_no, language, extraction_method,
  extraction_status, content_hash, text_content, structure, created_at
)
select
  n->>'id',
  n->>'organizationId',
  n->>'documentRef',
  coalesce((n->>'sourceVersion')::int,1),
  n->>'language',
  coalesce(n->'structure'->>'parser', n->'structure'->>'kind', 'legacy-parser'),
  'ready',
  n->>'contentHash',
  coalesce(n->>'text',''),
  coalesce(n->'structure','{}'::jsonb),
  coalesce((n->>'createdAt')::timestamptz,now())
from norms
where n ? 'id' and n ? 'documentRef'
on conflict (document_ref,version_no) do update set
  language=excluded.language,
  extraction_method=excluded.extraction_method,
  content_hash=excluded.content_hash,
  text_content=excluded.text_content,
  structure=excluded.structure;

with state as (
  select payload from runtime_state where id='primary'
),
norms as (
  select n
  from state, jsonb_array_elements(coalesce(payload->'normalizedDocuments','[]'::jsonb)) n
),
units as (
  select
    n,
    u.value as unit,
    u.ordinality::int as ord
  from norms n
  cross join lateral jsonb_array_elements(coalesce(n->'units','[]'::jsonb))
    with ordinality as u(value, ordinality)
)
insert into document_text_units (
  id, organization_id, document_ref, document_text_ref, unit_index,
  unit_kind, page_no, paragraph_no, slide_no, sheet_no, cell_ref,
  text_content, location_pointer
)
select
  (n->>'id') || ':UNIT:' || ord,
  n->>'organizationId',
  n->>'documentRef',
  n->>'id',
  ord,
  coalesce(unit->'locationPointer'->>'kind','segment'),
  nullif(unit->'locationPointer'->>'page','')::int,
  nullif(unit->'locationPointer'->>'paragraph','')::int,
  nullif(unit->'locationPointer'->>'slide','')::int,
  nullif(unit->'locationPointer'->>'sheet','')::int,
  unit->'locationPointer'->>'cell',
  coalesce(unit->>'text',''),
  coalesce(unit->'locationPointer','{}'::jsonb)
from units
on conflict (document_text_ref,unit_index) do update set
  text_content=excluded.text_content,
  location_pointer=excluded.location_pointer;

with state as (
  select payload from runtime_state where id='primary'
),
arts as (
  select a
  from state, jsonb_array_elements(coalesce(payload->'artifacts','[]'::jsonb)) a
)
insert into document_artifacts (
  id, organization_id, document_ref, version_no, file_name, mime_type,
  size_bytes, checksum_sha256, storage_provider, object_key, storage_payload,
  status, reused_from_artifact_ref, created_at
)
select
  a->>'id',
  a->>'organizationId',
  a->>'documentRef',
  1,
  coalesce(a->>'fileName','unknown'),
  a->>'mimeType',
  nullif(a->>'size','')::bigint,
  coalesce(a->>'checksum','migration-missing'),
  coalesce(a->'storage'->>'provider','legacy'),
  a->'storage'->>'objectKey',
  coalesce(a->'storage','{}'::jsonb),
  coalesce(a->>'status','committed'),
  a->>'reusedFromArtifactRef',
  coalesce((a->>'createdAt')::timestamptz,now())
from arts
where a ? 'id' and a ? 'documentRef'
on conflict (id) do nothing;

-- Verification queries
select count(*) as documents_v1 from documents;
select count(*) as document_texts_v1 from document_texts;
select count(*) as document_text_units_v1 from document_text_units;
select count(*) as document_artifacts_v1 from document_artifacts;
