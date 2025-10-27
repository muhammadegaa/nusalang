import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../runtime/db.js';

describe('Mock Database', () => {
  beforeEach(() => {
    db.clearAll();
  });

  it('should insert records', async () => {
    const user = await db.table('users').insert({ name: 'Alice', age: 30 });
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.age).toBe(30);
  });

  it('should find records by ID', async () => {
    const inserted = await db.table('users').insert({ name: 'Bob' });
    const found = await db.table('users').find(inserted.id);
    expect(found).toEqual(inserted);
  });

  it('should find records by filter', async () => {
    await db.table('users').insert({ name: 'Alice', active: true });
    await db.table('users').insert({ name: 'Bob', active: false });
    
    const found = await db.table('users').find({ active: true });
    expect(found?.name).toBe('Alice');
  });

  it('should query records with filter', async () => {
    await db.table('users').insert({ name: 'Alice', role: 'admin' });
    await db.table('users').insert({ name: 'Bob', role: 'user' });
    await db.table('users').insert({ name: 'Charlie', role: 'admin' });
    
    const admins = await db.table('users').query({ role: 'admin' });
    expect(admins).toHaveLength(2);
    expect(admins[0].name).toBe('Alice');
    expect(admins[1].name).toBe('Charlie');
  });

  it('should support query options (limit, offset)', async () => {
    for (let i = 1; i <= 10; i++) {
      await db.table('users').insert({ name: `User${i}` });
    }
    
    const page1 = await db.table('users').query({}, { limit: 3, offset: 0 });
    expect(page1).toHaveLength(3);
    expect(page1[0].name).toBe('User1');
    
    const page2 = await db.table('users').query({}, { limit: 3, offset: 3 });
    expect(page2).toHaveLength(3);
    expect(page2[0].name).toBe('User4');
  });

  it('should update records', async () => {
    const user = await db.table('users').insert({ name: 'Alice', age: 30 });
    const updated = await db.table('users').update(user.id, { age: 31 });
    
    expect(updated?.age).toBe(31);
    expect(updated?.name).toBe('Alice');
  });

  it('should delete records', async () => {
    const user = await db.table('users').insert({ name: 'Alice' });
    const deleted = await db.table('users').delete(user.id);
    
    expect(deleted).toBe(true);
    
    const found = await db.table('users').find(user.id);
    expect(found).toBeNull();
  });

  it('should get all records', async () => {
    await db.table('users').insert({ name: 'Alice' });
    await db.table('users').insert({ name: 'Bob' });
    
    const all = await db.table('users').all();
    expect(all).toHaveLength(2);
  });

  it('should support ordering', async () => {
    await db.table('users').insert({ name: 'Charlie', age: 25 });
    await db.table('users').insert({ name: 'Alice', age: 30 });
    await db.table('users').insert({ name: 'Bob', age: 20 });
    
    const ordered = await db.table('users').query({}, { orderBy: 'age', order: 'asc' });
    expect(ordered[0].name).toBe('Bob');
    expect(ordered[1].name).toBe('Charlie');
    expect(ordered[2].name).toBe('Alice');
  });
});

