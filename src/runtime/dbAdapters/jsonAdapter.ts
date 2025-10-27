/**
 * JSON File-Based Database Adapter
 * Simple persistent storage using JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DatabaseAdapter, TableOperations } from './index.js';

interface JSONTableData {
  records: Record<string, any>[];
  nextId: number;
}

export class JSONAdapter implements DatabaseAdapter {
  private dataDir: string;
  private tables: Map<string, JSONTableData> = new Map();

  constructor(dataDir: string = './.nusalang/data') {
    this.dataDir = dataDir;
  }

  async connect(): Promise<void> {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Load existing tables
    const files = fs.readdirSync(this.dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const tableName = file.replace('.json', '');
        this.loadTable(tableName);
      }
    }
  }

  async disconnect(): Promise<void> {
    // Save all tables before disconnecting
    for (const [tableName] of this.tables) {
      this.saveTable(tableName);
    }
  }

  table(name: string): TableOperations {
    // Initialize table if it doesn't exist
    if (!this.tables.has(name)) {
      this.tables.set(name, { records: [], nextId: 1 });
    }
    
    return new JSONTableOperations(name, this);
  }

  async transaction<T>(callback: () => T | Promise<T>): Promise<T> {
    // Simple transaction: execute callback and save all tables
    try {
      const result = await callback();
      
      // Save all tables after successful transaction
      for (const [tableName] of this.tables) {
        this.saveTable(tableName);
      }
      
      return result;
    } catch (error) {
      // Reload tables to revert changes
      for (const [tableName] of this.tables) {
        this.loadTable(tableName);
      }
      throw error;
    }
  }

  async listTables(): Promise<string[]> {
    return Array.from(this.tables.keys());
  }

  async dropTable(name: string): Promise<void> {
    this.tables.delete(name);
    const filePath = path.join(this.dataDir, `${name}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Internal methods
  getTableData(name: string): JSONTableData {
    if (!this.tables.has(name)) {
      this.tables.set(name, { records: [], nextId: 1 });
    }
    return this.tables.get(name)!;
  }

  saveTable(name: string): void {
    const tableData = this.tables.get(name);
    if (tableData) {
      const filePath = path.join(this.dataDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(tableData, null, 2));
    }
  }

  private loadTable(name: string): void {
    const filePath = path.join(this.dataDir, `${name}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      this.tables.set(name, data);
    }
  }
}

class JSONTableOperations implements TableOperations {
  constructor(private tableName: string, private adapter: JSONAdapter) {}

  async insert(data: Record<string, any>): Promise<any> {
    const tableData = this.adapter.getTableData(this.tableName);
    
    // Auto-increment ID
    const id = tableData.nextId++;
    const record = { id, ...data };
    
    tableData.records.push(record);
    this.adapter.saveTable(this.tableName);
    
    return record;
  }

  async findMany(filter?: Record<string, any>): Promise<any[]> {
    const tableData = this.adapter.getTableData(this.tableName);
    
    if (!filter || Object.keys(filter).length === 0) {
      return [...tableData.records];
    }
    
    return tableData.records.filter(record => this.matchesFilter(record, filter));
  }

  async findOne(filter: Record<string, any>): Promise<any | null> {
    const tableData = this.adapter.getTableData(this.tableName);
    const found = tableData.records.find(record => this.matchesFilter(record, filter));
    return found || null;
  }

  async update(filter: Record<string, any>, data: Record<string, any>): Promise<number> {
    const tableData = this.adapter.getTableData(this.tableName);
    let count = 0;
    
    for (const record of tableData.records) {
      if (this.matchesFilter(record, filter)) {
        Object.assign(record, data);
        count++;
      }
    }
    
    if (count > 0) {
      this.adapter.saveTable(this.tableName);
    }
    
    return count;
  }

  async delete(filter: Record<string, any>): Promise<number> {
    const tableData = this.adapter.getTableData(this.tableName);
    const before = tableData.records.length;
    
    tableData.records = tableData.records.filter(record => !this.matchesFilter(record, filter));
    
    const deleted = before - tableData.records.length;
    
    if (deleted > 0) {
      this.adapter.saveTable(this.tableName);
    }
    
    return deleted;
  }

  async query(filter: Record<string, any>): Promise<any[]> {
    return this.findMany(filter);
  }

  async count(filter?: Record<string, any>): Promise<number> {
    const records = await this.findMany(filter);
    return records.length;
  }

  async paginate(options: { skip?: number; take?: number; where?: Record<string, any> }): Promise<any[]> {
    const { skip = 0, take = 10, where } = options;
    const records = await this.findMany(where);
    return records.slice(skip, skip + take);
  }

  private matchesFilter(record: Record<string, any>, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => record[key] === value);
  }
}

