/**
 * Mock Database Module
 * Provides in-memory database with CRUD operations
 */

export interface DBRecord {
  id: string | number;
  [key: string]: any;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

class MockDatabase {
  private tables: Map<string, DBRecord[]> = new Map();
  private nextIds: Map<string, number> = new Map();

  constructor() {
    // Initialize with some default tables
    this.tables.set('users', []);
    this.tables.set('posts', []);
    this.tables.set('comments', []);
  }

  /**
   * Get a table proxy for fluent API
   */
  table(tableName: string): TableProxy {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
      this.nextIds.set(tableName, 1);
    }
    return new TableProxy(this, tableName);
  }

  /**
   * Get all records from a table
   */
  getAll(tableName: string): DBRecord[] {
    return this.tables.get(tableName) || [];
  }

  /**
   * Query records with filter
   */
  query(tableName: string, filter: Record<string, any>, options: QueryOptions = {}): DBRecord[] {
    let records = this.getAll(tableName);

    // Apply filter
    if (Object.keys(filter).length > 0) {
      records = records.filter((record) => {
        return Object.entries(filter).every(([key, value]) => {
          return record[key] === value;
        });
      });
    }

    // Apply ordering
    if (options.orderBy) {
      const order = options.order || 'asc';
      records.sort((a, b) => {
        const aVal = a[options.orderBy!];
        const bVal = b[options.orderBy!];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options.offset !== undefined) {
      records = records.slice(options.offset);
    }
    if (options.limit !== undefined) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  /**
   * Find a single record by ID or filter
   */
  find(tableName: string, idOrFilter: any): DBRecord | null {
    const records = this.getAll(tableName);

    if (typeof idOrFilter === 'object') {
      return records.find((record) => {
        return Object.entries(idOrFilter).every(([key, value]) => {
          return record[key] === value;
        });
      }) || null;
    }

    return records.find((record) => record.id === idOrFilter) || null;
  }

  /**
   * Insert a new record
   */
  insert(tableName: string, data: Omit<DBRecord, 'id'> | DBRecord): DBRecord {
    const table = this.getAll(tableName);
    
    // Generate ID if not provided
    let record: DBRecord;
    if ('id' in data && data.id !== undefined) {
      record = data as DBRecord;
    } else {
      const nextId = this.nextIds.get(tableName) || 1;
      record = { ...data, id: nextId };
      this.nextIds.set(tableName, nextId + 1);
    }

    table.push(record);
    return record;
  }

  /**
   * Update a record
   */
  update(tableName: string, id: string | number, data: Partial<DBRecord>): DBRecord | null {
    const table = this.getAll(tableName);
    const index = table.findIndex((record) => record.id === id);

    if (index === -1) {
      return null;
    }

    table[index] = { ...table[index], ...data, id };
    return table[index];
  }

  /**
   * Delete a record
   */
  delete(tableName: string, id: string | number): boolean {
    const table = this.getAll(tableName);
    const index = table.findIndex((record) => record.id === id);

    if (index === -1) {
      return false;
    }

    table.splice(index, 1);
    return true;
  }

  /**
   * Clear all data from a table
   */
  clear(tableName: string): void {
    this.tables.set(tableName, []);
    this.nextIds.set(tableName, 1);
  }

  /**
   * Clear all tables
   */
  clearAll(): void {
    this.tables.clear();
    this.nextIds.clear();
  }

  /**
   * Seed data for testing
   */
  seed(tableName: string, records: DBRecord[]): void {
    this.tables.set(tableName, [...records]);
    const maxId = records.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
    this.nextIds.set(tableName, maxId + 1);
  }
}

/**
 * Table proxy for fluent API
 */
class TableProxy {
  constructor(private db: MockDatabase, private tableName: string) {}

  async query(filter: Record<string, any> = {}, options?: QueryOptions): Promise<DBRecord[]> {
    return Promise.resolve(this.db.query(this.tableName, filter, options));
  }

  async find(idOrFilter: any): Promise<DBRecord | null> {
    return Promise.resolve(this.db.find(this.tableName, idOrFilter));
  }

  async insert(data: Omit<DBRecord, 'id'> | DBRecord): Promise<DBRecord> {
    return Promise.resolve(this.db.insert(this.tableName, data));
  }

  async update(id: string | number, data: Partial<DBRecord>): Promise<DBRecord | null> {
    return Promise.resolve(this.db.update(this.tableName, id, data));
  }

  async delete(id: string | number): Promise<boolean> {
    return Promise.resolve(this.db.delete(this.tableName, id));
  }

  async all(): Promise<DBRecord[]> {
    return Promise.resolve(this.db.getAll(this.tableName));
  }
}

// Export singleton instance
export const db = new MockDatabase();

// Export for type usage
export type { MockDatabase, TableProxy };

