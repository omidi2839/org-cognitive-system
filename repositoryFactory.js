import { MemoryRepository } from './memoryRepository.js';
import { PostgresRepository } from './postgresRepository.js';

let singleton;
export function createRepository(){
  if(singleton) return singleton;
  singleton = process.env.DATABASE_URL
    ? new PostgresRepository(process.env.DATABASE_URL)
    : new MemoryRepository();
  return singleton;
}
export function repositoryMode(){ return process.env.DATABASE_URL ? 'postgres' : 'ephemeral-memory'; }
