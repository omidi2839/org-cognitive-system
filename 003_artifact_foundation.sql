-- Build 0.3.2 keeps aggregate runtime_state for fast iteration, while defining durable artifact metadata tables for the split-repository migration path.
create table if not exists artifact_registry (
 id text primary key, organization_id text not null, document_ref text not null,
 file_name text not null, mime_type text, size_bytes bigint not null, checksum_sha256 text not null,
 storage_provider text not null, object_key text not null, created_at timestamptz not null default now()
);
create index if not exists artifact_registry_org_doc_idx on artifact_registry(organization_id,document_ref);
