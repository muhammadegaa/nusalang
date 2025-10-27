/**
 * Tests for Reactive Runtime (Phase 0.9)
 */

import { describe, it, expect } from 'vitest';
import { signal, Computed } from '../runtime/reactivity.js';

describe('Reactive Runtime', () => {
  describe('Signal', () => {
    it('creates signal with initial value', () => {
      const count = signal(0);
      expect(count.value).toBe(0);
    });

    it('updates signal value', () => {
      const count = signal(0);
      count.value = 5;
      expect(count.value).toBe(5);
    });

    it('notifies subscribers on change', () => {
      const count = signal(0);
      let observed = 0;
      count.subscribe(() => { observed = count.value; });
      count.value = 10;
      expect(observed).toBe(10);
    });

    it('does not notify if unchanged', () => {
      const count = signal(5);
      let calls = 0;
      count.subscribe(() => { calls++; });
      count.value = 5;
      expect(calls).toBe(0);
    });

    it('returns unsubscribe function', () => {
      const count = signal(0);
      let observed = 0;
      const unsub = count.subscribe(() => { observed = count.value; });
      count.value = 5;
      expect(observed).toBe(5);
      unsub();
      count.value = 10;
      expect(observed).toBe(5);
    });

    it('supports multiple subscribers', () => {
      const count = signal(0);
      let a = 0, b = 0;
      count.subscribe(() => { a = count.value; });
      count.subscribe(() => { b = count.value * 2; });
      count.value = 5;
      expect(a).toBe(5);
      expect(b).toBe(10);
    });

    it('supports peek without side effects', () => {
      const count = signal(10);
      expect(count.peek()).toBe(10);
    });
  });

  describe('Computed', () => {
    it('computes derived value', () => {
      const count = signal(5);
      const doubled = new Computed(() => count.value * 2, [count]);
      expect(doubled.value).toBe(10);
    });

    it('auto-updates when dependency changes', () => {
      const count = signal(5);
      const doubled = new Computed(() => count.value * 2, [count]);
      count.value = 10;
      expect(doubled.value).toBe(20);
    });

    it('tracks multiple dependencies', () => {
      const a = signal(2);
      const b = signal(3);
      const product = new (computed as any).Computed(() => a.value * b.value, [a, b]);
      expect(product.value).toBe(6);
      a.value = 4;
      expect(product.value).toBe(12);
      b.value = 5;
      expect(product.value).toBe(20);
    });

    it('throws when trying to set computed', () => {
      const count = signal(5);
      const doubled = new Computed(() => count.value * 2, [count]);
      expect(() => { doubled.value = 100; }).toThrow('Cannot set computed signal');
    });

    it('chains computed values', () => {
      const count = signal(2);
      const doubled = new Computed(() => count.value * 2, [count]);
      const quadrupled = new (computed as any).Computed(() => doubled.value * 2, [doubled]);
      expect(quadrupled.value).toBe(8);
      count.value = 5;
      expect(quadrupled.value).toBe(20);
    });

    it('disposes computed signal', () => {
      const count = signal(2);
      const doubled = new Computed(() => count.value * 2, [count]);
      expect(doubled.value).toBe(4);
      doubled.dispose();
      count.value = 10;
      expect(doubled.value).toBe(4); // Shouldn't update
    });
  });

  describe('Integration', () => {
    it('works with complex reactivity graph', () => {
      const firstName = signal('John');
      const lastName = signal('Doe');
      const fullName = new (computed as any).Computed(
        () => `${firstName.value} ${lastName.value}`,
        [firstName, lastName]
      );
      
      expect(fullName.value).toBe('John Doe');
      firstName.value = 'Jane';
      expect(fullName.value).toBe('Jane Doe');
      lastName.value = 'Smith';
      expect(fullName.value).toBe('Jane Smith');
    });

    it('handles multiple levels of computation', () => {
      const base = signal(1);
      const times2 = new (computed as any).Computed(() => base.value * 2, [base]);
      const times4 = new (computed as any).Computed(() => times2.value * 2, [times2]);
      const times8 = new (computed as any).Computed(() => times4.value * 2, [times4]);
      
      expect(times8.value).toBe(8);
      base.value = 2;
      expect(times8.value).toBe(16);
    });
  });
});
