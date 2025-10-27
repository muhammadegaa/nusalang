/**
 * Database Adapter Interface
 * Provides abstraction over different database backends
 */

export interface DatabaseAdapter {
  // Table operations
  table(name: string): TableOperations;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Transaction support
  transaction<T>(callback: () => T | Promise<T>): Promise<T>;
  
  // Metadata
  listTables(): Promise<string[]>;
  dropTable(name: string): Promise<void>;
}

export interface TableOperations {
  // CRUD operations
  insert(data: Record<string, any>): Promise<any>;
  findMany(filter?: Record<string, any>): Promise<any[]>;
  findOne(filter: Record<string, any>): Promise<any | null>;
  update(filter: Record<string, any>, data: Record<string, any>): Promise<number>;
  delete(filter: Record<string, any>): Promise<number>;
  
  // Advanced queries
  query(filter: Record<string, any>): Promise<any[]>;
  count(filter?: Record<string, any>): Promise<number>;
  
  // Pagination
  paginate(options: { skip?: number; take?: number; where?: Record<string, any> }): Promise<any[]>;
}

/**
 * Get database adapter based on configuration
 */
export function getAdapter(type: string = 'json'): DatabaseAdapter {
  switch (type.toLowerCase()) {
    case 'json':
      const { JSONAdapter } = require('./jsonAdapter.js');
      return new JSONAdapter();
    
    case 'postgres':
      const { PostgresAdapter } = require('./postgresAdapter.js');
      return new PostgresAdapter();
    
    default:
      throw new Error(`Unknown database adapter: ${type}`);
  }
}

