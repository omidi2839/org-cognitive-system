-- Durable transactional state used by Build 0.3.1 while domain repositories are incrementally split into dedicated tables.
create table if not exists runtime_state (
  id text primary key,
  payload jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
insert into runtime_state(id,payload)
values ('primary','{"documents":[],"candidates":[],"audit":[],"provenance":[],"aiExecutions":[]}'::jsonb)
on conflict (id) do nothing;
