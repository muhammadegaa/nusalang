# Runtime Reactivity Architecture

**Phase 0.9** | **Status**: Implemented

---

## Overview

NusaLang's reactive runtime provides signal-based state management and real-time data streaming through WebSockets. The system is designed to be simple, predictable, and performant.

---

## Core Concepts

### 1. Signals

Signals are **observable values** that notify subscribers when they change.

```typescript
const count = signal(0);

// Subscribe
count.subscribe(() => {
  console.log('Count changed to:', count.value);
});

// Update (triggers subscribers)
count.value = 5; // Logs: "Count changed to: 5"
```

**Key Features**:
- Automatic notification on change
- Identity comparison (no notify if value unchanged)
- Unsubscribe support
- Peek without tracking

### 2. Computed Signals

Computed signals are **derived values** that automatically update when dependencies change.

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = new Computed(
  () => `${firstName.value} ${lastName.value}`,
  [firstName, lastName]
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

**Key Features**:
- Explicit dependency declaration
- Automatic re-computation
- Read-only (throws on set)
- Chainable

### 3. WebSocket Streaming

Real-time data communication through WebSocket connections.

```typescript
// Subscribe to messages
subscribe('ws://api.example.com/updates', (data) => {
  console.log('Received:', data);
});

// Publish data
publish('ws://api.example.com/events', {
  type: 'user_action',
  payload: { action: 'click' }
});
```

**Key Features**:
- Automatic JSON serialization
- Multiple handlers per URL
- Connection pooling
- Graceful error handling

---

## Implementation Details

### Signal Implementation

```typescript
export class Signal<T> {
  private _value: T;
  private subscribers = new Set<Subscriber>();

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
}
```

### Computed Implementation

```typescript
export class Computed<T> extends Signal<T> {
  constructor(computeFn: () => T, deps: Signal<any>[]) {
    super(computeFn());
    
    // Subscribe to all dependencies
    deps.forEach(dep => {
      dep.subscribe(() => {
        super.value = computeFn();
      });
    });
  }

  set value(_: T) {
    throw new Error('Cannot set computed signal');
  }
}
```

---

## Design Decisions

### Explicit Dependency Tracking

**Decision**: Require manual dependency specification in `computed()`.

**Rationale**:
- Simpler implementation (< 100 LOC)
- Clearer mental model
- No hidden magic or proxy overhead
- Easier debugging

**Tradeoff**: More verbose than automatic tracking (e.g., Solid.js, Vue 3).

**Future**: Can add automatic tracking in Phase 1.x without breaking changes.

### Synchronous Updates

**Decision**: All signal updates propagate immediately.

**Rationale**:
- Predictable execution order
- No batching complexity
- Easier to reason about
- Sufficient for most use cases

**Tradeoff**: May cause multiple re-computations in complex graphs.

**Future**: Add batching API in Phase 1.x: `batch(() => { ... })`.

### Manual Subscriptions

**Decision**: No automatic effect tracking (unlike Solid.js/React).

**Rationale**:
- Phase 0.9 focuses on core primitives
- Effects can be built on top
- Keeps API surface small

**Future**: Add `effect()` with automatic tracking in Phase 1.x.

---

## Usage Patterns

### Pattern 1: Reactive State

```nusa
fn Counter() {
  let count = signal(0)
  
  count.subscribe(fn() {
    print(`Count is now: ${count.value}`)
  })
  
  count.value = count.value + 1
}
```

### Pattern 2: Derived State

```nusa
fn UserProfile() {
  let firstName = signal("John")
  let lastName = signal("Doe")
  
  let fullName = computed(
    fn() { return `${firstName.value} ${lastName.value}` },
    [firstName, lastName]
  )
  
  print(fullName.value) // "John Doe"
}
```

### Pattern 3: Live Data Streaming

```nusa
fn LiveDashboard() {
  let metrics = signal({})
  
  subscribe("wss://metrics.example.com", fn(data) {
    metrics.value = data
    print(`Updated metrics: ${metrics.value}`)
  })
}
```

### Pattern 4: Chained Computed

```nusa
fn DataPipeline() {
  let raw = signal([1, 2, 3])
  
  let doubled = computed(
    fn() { return raw.value.map(fn(x) { return x * 2 }) },
    [raw]
  )
  
  let sum = computed(
    fn() { return doubled.value.reduce(fn(a, b) { return a + b }, 0) },
    [doubled]
  )
  
  print(sum.value) // 12
}
```

---

## Performance Considerations

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Signal read | O(1) | Direct property access |
| Signal write | O(n) | n = number of subscribers |
| Computed read | O(1) | Cached value |
| Computed invalidation | O(1) | Triggered by dependency |

### Memory Usage

- **Signal**: ~100 bytes + subscriber set
- **Computed**: ~150 bytes + subscriber set + unsubscribers
- **WebSocket**: ~500 bytes per connection

### Optimization Tips

1. **Minimize Subscribers**: Each subscriber adds memory and execution overhead.
2. **Dispose Computed Values**: Call `.dispose()` when done to free resources.
3. **Batch Updates**: Group multiple signal updates (future API).
4. **Use Peek**: Use `.peek()` when you don't need tracking.

---

## Testing

### Unit Tests

```typescript
it('notifies subscribers on change', () => {
  const count = signal(0);
  let observed = 0;
  
  count.subscribe(() => { observed = count.value; });
  count.value = 10;
  
  expect(observed).toBe(10);
});
```

### Integration Tests

```typescript
it('updates computed when dependency changes', () => {
  const a = signal(2);
  const b = signal(3);
  const sum = new Computed(() => a.value + b.value, [a, b]);
  
  expect(sum.value).toBe(5);
  
  a.value = 10;
  expect(sum.value).toBe(13);
});
```

---

## Comparison with Other Frameworks

### vs. Solid.js

| Feature | NusaLang (0.9) | Solid.js |
|---------|----------------|----------|
| Dependency Tracking | Manual | Automatic |
| Updates | Synchronous | Batched |
| API Complexity | Simple | Advanced |
| Bundle Size | ~300 LOC | ~8 KB |

### vs. Vue 3

| Feature | NusaLang (0.9) | Vue 3 |
|---------|----------------|-------|
| Reactivity Core | Signal-based | Proxy-based |
| Computed | Explicit deps | Auto-tracked |
| Effects | Manual | Auto-tracked |
| TypeScript | Native | Good |

---

## Future Enhancements

### Phase 1.0
- [ ] Automatic dependency tracking
- [ ] Batched updates with `batch()` API
- [ ] Async computed values
- [ ] Effect scheduling

### Phase 1.1
- [ ] Reactive collections (arrays, maps, sets)
- [ ] Lazy evaluation option
- [ ] Transaction support
- [ ] DevTools integration

### Phase 1.2
- [ ] Time-travel debugging
- [ ] Undo/redo support
- [ ] Persistence adapters
- [ ] Reactive queries

---

## Troubleshooting

### Common Issues

**Issue**: Computed value not updating

```typescript
// ❌ Wrong: dependency not declared
const doubled = new Computed(() => count.value * 2, []);

// ✅ Correct: include all dependencies
const doubled = new Computed(() => count.value * 2, [count]);
```

**Issue**: Memory leak from subscribers

```typescript
// ❌ Wrong: subscription never cleaned up
signal.subscribe(() => { /* ... */ });

// ✅ Correct: store unsubscribe function
const unsub = signal.subscribe(() => { /* ... */ });
// Later:
unsub();
```

**Issue**: WebSocket not connecting

```typescript
// Check connection state
if (!isConnected('ws://api.example.com')) {
  console.log('Not connected yet');
}

// Verify URL format
subscribe('ws://api.example.com', handler); // ✅
subscribe('http://api.example.com', handler); // ❌
```

---

## Glossary

- **Signal**: Observable value that notifies on change
- **Computed**: Derived signal that auto-updates
- **Subscriber**: Function called when signal changes
- **Dependency**: Signal that a computed value reads
- **Effect**: Auto-running function (future)
- **Reactive**: Updates automatically when data changes

---

## References

- [Solid.js Reactivity](https://www.solidjs.com/docs/latest/api#reactivity)
- [Vue 3 Reactivity](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [MobX Concepts](https://mobx.js.org/README.html)
- [Signals Proposal](https://github.com/tc39/proposal-signals)

---

**Last Updated**: October 27, 2025  
**Phase**: 0.9  
**Status**: Complete

