/**
 * Reactive Runtime for NusaLang (Phase 0.9)
 * Simplified signal-based reactivity
 */

export type Subscriber = () => void;

/**
 * Signal: Observable value
 */
export class Signal<T> {
  protected _value: T;
  protected subscribers = new Set<Subscriber>();

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (Object.is(newValue, this._value)) return;
    this._value = newValue;
    this.subscribers.forEach(fn => fn());
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  peek(): T {
    return this._value;
  }
}

/**
 * Effect: Run function when dependencies change
 */
export class Effect {
  private unsubscribers: Array<() => void> = [];

  constructor(public fn: () => void) {
    // Effects don't auto-track in this simplified version
    // Users must manually subscribe
  }

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

/**
 * Computed: Derived signal
 */
export class Computed<T> extends Signal<T> {
  private unsubscribers: Array<() => void>;
  private computeFn: () => T;

  constructor(computeFn: () => T, deps: Signal<any>[]) {
    const initialValue = computeFn();
    super(initialValue);
    this.computeFn = computeFn;
    this.unsubscribers = [];
    
    // Subscribe to all dependencies
    deps.forEach(dep => {
      const unsub = dep.subscribe(() => {
        // Directly update the internal value and notify subscribers
        const newValue = this.computeFn();
        if (!Object.is(newValue, this._value)) {
          this._value = newValue;
          this.subscribers.forEach(fn => fn());
        }
      });
      this.unsubscribers.push(unsub);
    });
  }

  // Override getter to maintain access
  get value(): T {
    return this._value;
  }

  // Override setter to prevent external modification
  set value(_: T) {
    throw new Error('Cannot set computed signal');
  }

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub());
  }
}

// Helper functions
export function signal<T>(v: T): Signal<T> {
  return new Signal(v);
}

export function effect(fn: () => void): Effect {
  return new Effect(fn);
}

export function computed<T>(computeFn: () => T, deps: Signal<any>[]): Computed<T> {
  return new Computed(computeFn, deps);
}

export function batch(fn: () => void): void {
  fn(); // Simple passthrough for now
}

export function untrack<T>(fn: () => T): T {
  return fn(); // Simple passthrough for now
}
