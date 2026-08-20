-- Initial schema. Mirrors packages/shared-types/src/index.ts.
-- Keep these in sync manually for now; consider codegen later once
-- the schema stabilizes.

create extension if not exists vector;

create table if not exists topics (
  id text primary key,               -- matches syllabus-graph static ids, e.g. 'phy-kinematics'
  subject text not null check (subject in ('physics','chemistry','maths')),
  name text not null,
  parent_id text references topics(id)
);

create table if not exists user_topic_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references topics(id),
  mastery_state text not null default 'not_started'
    check (mastery_state in ('not_started','learning','practicing','weak','okay','strong','mastered')),
  last_practiced_at timestamptz,
  primary key (user_id, topic_id)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (subject in ('physics','chemistry','maths')),
  topic_id text references topics(id),
  type text not null check (type in ('learning','homework','practice','revision','test_prep','recovery')),
  title text not null,
  estimated_minutes int not null,
  deadline timestamptz,
  is_optional boolean not null default false,
  source_doc_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists day_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  blocks jsonb not null,             -- array of ScheduleBlock
  generated_at timestamptz not null default now(),
  regenerated_reason text,
  unique (user_id, date, generated_at)
);

create table if not exists energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  level int not null check (level between 1 and 5),
  note text
);

create table if not exists question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references tasks(id),
  subject text not null check (subject in ('physics','chemistry','maths')),
  topic_id text references topics(id),
  difficulty text not null check (difficulty in ('easy','medium','hard','jee_main','jee_advanced')),
  time_taken_seconds int not null,
  result text not null check (result in ('solved','wrong','skipped','concept_gap','silly_mistake')),
  mistake_type text check (mistake_type in ('concept_gap','formula_forgotten','calculation','misread_question','wrong_approach','time_pressure','guess')),
  attempted_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text check (subject in ('physics','chemistry','maths')),
  title text not null,
  storage_path text not null,        -- Supabase Storage path
  uploaded_at timestamptz not null default now()
);

-- RAG chunks for document intelligence (section 6 of architecture doc).
-- embedding dimension assumes a common free embedding model; adjust once
-- the specific embedding provider is chosen.
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_text text not null,
  chunk_index int not null,
  embedding vector(768)
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops);

-- Row Level Security: every table is per-user. Enable RLS and restrict
-- access to the owning user. Run these before shipping any real data.
alter table user_topic_state enable row level security;
alter table tasks enable row level security;
alter table day_schedules enable row level security;
alter table energy_logs enable row level security;
alter table question_attempts enable row level security;
alter table documents enable row level security;

create policy "own rows only" on user_topic_state for all using (auth.uid() = user_id);
create policy "own rows only" on tasks for all using (auth.uid() = user_id);
create policy "own rows only" on day_schedules for all using (auth.uid() = user_id);
create policy "own rows only" on energy_logs for all using (auth.uid() = user_id);
create policy "own rows only" on question_attempts for all using (auth.uid() = user_id);
create policy "own rows only" on documents for all using (auth.uid() = user_id);
