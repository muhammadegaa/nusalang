import { describe, it, expect, beforeEach } from 'vitest';
import { router } from '../runtime/router.js';

describe('Router', () => {
  beforeEach(() => {
    router.clear();
  });

  it('should register pages', () => {
    router.registerPage('/home', () => 'home page');
    const page = router.getPage('/home');
    
    expect(page).toBeDefined();
    expect(page?.path).toBe('/home');
  });

  it('should match exact paths', () => {
    router.registerPage('/about', () => 'about page');
    const match = router.match('/about');
    
    expect(match).toBeDefined();
    expect(match?.page.path).toBe('/about');
  });

  it('should match dynamic params', () => {
    router.registerPage('/users/:id', () => 'user page');
    const match = router.match('/users/123');
    
    expect(match).toBeDefined();
    expect(match?.match.params.id).toBe('123');
  });

  it('should return null for no match', () => {
    router.registerPage('/home', () => 'home');
    const match = router.match('/nonexistent');
    
    expect(match).toBeNull();
  });

  it('should execute page handlers', async () => {
    router.registerPage('/test', () => 'test result');
    const result = await router.execute('/test');
    
    expect(result).toBe('test result');
  });

  it('should execute async page handlers', async () => {
    router.registerPage('/async', async () => {
      return Promise.resolve('async result');
    });
    const result = await router.execute('/async');
    
    expect(result).toBe('async result');
  });

  it('should pass route match to handler', async () => {
    router.registerPage('/users/:id', (match) => {
      return `User ${match.params.id}`;
    });
    const result = await router.execute('/users/42');
    
    expect(result).toBe('User 42');
  });

  it('should get all pages', () => {
    router.registerPage('/home', () => 'home');
    router.registerPage('/about', () => 'about');
    
    const pages = router.getAllPages();
    expect(pages).toHaveLength(2);
  });

  it('should throw error for nonexistent route execution', async () => {
    await expect(router.execute('/nonexistent')).rejects.toThrow('No page found');
  });
});

