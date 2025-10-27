/**
 * PostgreSQL Database Adapter (Stub)
 * To be implemented in future phase with actual pg library
 */

import type { DatabaseAdapter, TableOperations } from './index.js';

export class PostgresAdapter implements DatabaseAdapter {
  constructor(_connectionString?: string) {
    throw new Error('PostgreSQL adapter not yet implemented. Use JSON adapter for now.');
  }

  async connect(): Promise<void> {
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Not implemented');
  }

  table(_name: string): TableOperations {
    throw new Error('Not implemented');
  }

  async transaction<T>(_callback: () => T | Promise<T>): Promise<T> {
    throw new Error('Not implemented');
  }

  async listTables(): Promise<string[]> {
    throw new Error('Not implemented');
  }

  async dropTable(_name: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

