import { MemoryRepository } from './memoryRepository.js';
import { PostgresRepository } from './postgresRepository.js';

let singleton;

export function databaseConnectionUrl(){
  return process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '';
}

export function databaseProvider(){
  if(process.env.SUPABASE_DATABASE_URL) return 'supabase-postgres';
  if(process.env.DATABASE_URL) return 'postgres';
  return 'ephemeral-memory';
}

export function createRepository(){
  if(singleton) return singleton;
  const connectionString = databaseConnectionUrl();
  singleton = connectionString
    ? new PostgresRepository(connectionString)
    : new MemoryRepository();
  return singleton;
}

export function repositoryMode(){
  return databaseProvider();
}
