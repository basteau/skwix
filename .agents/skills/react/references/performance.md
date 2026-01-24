# JavaScript & Rendering Performance

Low-level optimizations for React applications.

## DOM & Rendering

### Avoid Layout Thrashing

Reading layout properties forces synchronous reflow.

```typescript
// ❌ Forces reflow after each write
function updateElements(elements: HTMLElement[]) {
  elements.forEach(el => {
    el.style.width = '100px'
    const width = el.offsetWidth  // Forces reflow!
    el.style.height = `${width * 2}px`
  })
}

// ✅ Batch reads, then writes
function updateElements(elements: HTMLElement[]) {
  // Read phase
  const measurements = elements.map(el => el.offsetWidth)
  
  // Write phase
  elements.forEach((el, i) => {
    el.style.width = '100px'
    el.style.height = `${measurements[i] * 2}px`
  })
}
```

**Layout-triggering properties:** `offsetWidth`, `offsetHeight`, `offsetTop`, `offsetLeft`, `clientWidth`, `clientHeight`, `scrollWidth`, `scrollHeight`, `getComputedStyle()`, `getBoundingClientRect()`

### Use CSS Classes for Styling

```typescript
// ❌ Multiple style changes
element.style.width = '100px'
element.style.height = '200px'
element.style.backgroundColor = 'blue'

// ✅ Single class toggle
element.classList.add('expanded')
```

### content-visibility for Lists

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;  /* Estimated height */
}
```

```typescript
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map(msg => (
        <div key={msg.id} className="list-item">
          <Message data={msg} />
        </div>
      ))}
    </div>
  )
}
```

Browser skips layout/paint for off-screen items.

### Passive Event Listeners

```typescript
// ❌ Blocks scrolling
element.addEventListener('touchstart', handler)
element.addEventListener('wheel', handler)

// ✅ Non-blocking
element.addEventListener('touchstart', handler, { passive: true })
element.addEventListener('wheel', handler, { passive: true })
```

**Use passive when:** handler doesn't call `preventDefault()`

### requestAnimationFrame for Visual Updates

```typescript
// ❌ May cause jank
function updateOnScroll() {
  setPosition(window.scrollY)
}
window.addEventListener('scroll', updateOnScroll)

// ✅ Synced to frame rate
function updateOnScroll() {
  requestAnimationFrame(() => {
    setPosition(window.scrollY)
  })
}
window.addEventListener('scroll', updateOnScroll, { passive: true })
```

### Debounce Expensive Updates

```typescript
import { useDeferredValue, useMemo } from 'react'

function SearchResults({ query }: { query: string }) {
  // Defer expensive computation
  const deferredQuery = useDeferredValue(query)
  
  const results = useMemo(
    () => filterLargeDataset(deferredQuery),
    [deferredQuery]
  )
  
  return <ResultsList results={results} />
}
```

## Data Structures

### Map for O(1) Lookups

```typescript
// ❌ O(n) per lookup
function enrichOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)  // O(n) each time
  }))
}

// ✅ O(1) per lookup
function enrichOrders(orders: Order[], users: User[]) {
  const userMap = new Map(users.map(u => [u.id, u]))
  return orders.map(order => ({
    ...order,
    user: userMap.get(order.userId)  // O(1)
  }))
}
```

### Set for O(1) Membership

```typescript
// ❌ O(n) per check
const selectedIds = ['a', 'b', 'c']
items.filter(item => selectedIds.includes(item.id))

// ✅ O(1) per check
const selectedSet = new Set(['a', 'b', 'c'])
items.filter(item => selectedSet.has(item.id))
```

### WeakMap for Object Keys

```typescript
// Cache expensive computations per object
const cache = new WeakMap<object, ComputedResult>()

function getComputed(obj: object): ComputedResult {
  if (cache.has(obj)) {
    return cache.get(obj)!
  }
  const result = expensiveComputation(obj)
  cache.set(obj, result)
  return result
}
```

## Loop Optimizations

### Combine Iterations

```typescript
// ❌ 3 iterations
const active = items.filter(i => i.active)
const names = active.map(i => i.name)
const upper = names.map(n => n.toUpperCase())

// ✅ 1 iteration
const result = items.reduce<string[]>((acc, item) => {
  if (item.active) {
    acc.push(item.name.toUpperCase())
  }
  return acc
}, [])
```

### Cache Length and Properties

```typescript
// ❌ Repeated access
for (let i = 0; i < items.length; i++) {
  process(items[i], config.settings.theme)
}

// ✅ Cached access
const len = items.length
const theme = config.settings.theme
for (let i = 0; i < len; i++) {
  process(items[i], theme)
}
```

### Early Exit

```typescript
// ❌ Checks all items
function hasAdmin(users: User[]): boolean {
  return users.filter(u => u.role === 'admin').length > 0
}

// ✅ Exits on first match
function hasAdmin(users: User[]): boolean {
  return users.some(u => u.role === 'admin')
}

// ✅ Early return in function
function processItems(items: Item[]) {
  if (items.length === 0) return []
  if (items.length === 1) return [transform(items[0])]
  
  // Complex logic for multiple items
}
```

### Check Length Before Expensive Operations

```typescript
// ❌ Sorts even for single item
function getMostRecent(items: Item[]): Item | null {
  const sorted = items.sort((a, b) => b.date - a.date)
  return sorted[0] ?? null
}

// ✅ Skip sort when unnecessary
function getMostRecent(items: Item[]): Item | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0]
  return items.reduce((latest, item) => 
    item.date > latest.date ? item : latest
  )
}
```

### Use Loop for Min/Max

```typescript
// ❌ O(n log n) - sorts entire array
const max = Math.max(...items.map(i => i.value))

// ✅ O(n) - single pass
let max = items[0]?.value ?? -Infinity
for (let i = 1; i < items.length; i++) {
  if (items[i].value > max) max = items[i].value
}
```

### Hoist RegExp

```typescript
// ❌ Creates regex on each iteration
items.forEach(item => {
  if (/^user-\d+$/.test(item.id)) {
    process(item)
  }
})

// ✅ Reuses single regex
const userIdPattern = /^user-\d+$/
items.forEach(item => {
  if (userIdPattern.test(item.id)) {
    process(item)
  }
})
```

## Immutability

### Use toSorted() for Immutable Sort

```typescript
// ❌ Mutates original array
const sorted = items.sort((a, b) => a.name.localeCompare(b.name))

// ✅ Returns new array (ES2023+)
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name))

// ✅ Fallback for older environments
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
```

### Efficient Object Updates

```typescript
// ❌ Spread for each property
const updated = { ...obj, a: 1, b: 2, c: 3 }

// ✅ Single spread is fine
const updated = { ...obj, a: 1, b: 2, c: 3 }

// ❌ Nested spreads are expensive
const updated = {
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      name: 'New Name'
    }
  }
}

// ✅ Use immer for complex updates
import { produce } from 'immer'

const updated = produce(state, draft => {
  draft.user.profile.name = 'New Name'
})
```

## Caching

### Module-Level Cache

```typescript
const cache = new Map<string, Result>()

export function expensiveOperation(key: string): Result {
  if (cache.has(key)) {
    return cache.get(key)!
  }
  const result = compute(key)
  cache.set(key, result)
  return result
}
```

### Cache localStorage Reads

```typescript
// ❌ Reads on every call
function getTheme(): string {
  return localStorage.getItem('theme') ?? 'light'
}

// ✅ Cached read
let cachedTheme: string | null = null

function getTheme(): string {
  if (cachedTheme === null) {
    try {
      cachedTheme = localStorage.getItem('theme') ?? 'light'
    } catch {
      cachedTheme = 'light'
    }
  }
  return cachedTheme
}

function setTheme(theme: string) {
  cachedTheme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {}
}
```

### Memoize with LRU

```typescript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, Result>({ max: 100 })

function compute(key: string): Result {
  const cached = cache.get(key)
  if (cached) return cached
  
  const result = expensiveComputation(key)
  cache.set(key, result)
  return result
}
```

## SVG Optimization

### Reduce Precision

```svg
<!-- ❌ Excessive precision -->
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />

<!-- ✅ Minimal precision -->
<path d="M 10.3 20.8 L 30.9 40.2" />
```

Use SVGO:
```bash
npx svgo --precision=1 --multipass icon.svg
```

### Animate Wrapper, Not SVG

```typescript
// ❌ No hardware acceleration
<svg className="animate-spin">
  <circle />
</svg>

// ✅ Hardware accelerated
<div className="animate-spin">
  <svg>
    <circle />
  </svg>
</div>
```

## Web Workers

### Offload Heavy Computation

```typescript
// worker.ts
self.onmessage = (e: MessageEvent<{ items: Item[] }>) => {
  const result = expensiveComputation(e.data.items)
  self.postMessage(result)
}

// component.tsx
function useWorkerComputation(items: Item[]) {
  const [result, setResult] = useState<Result | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url))
    workerRef.current.onmessage = (e) => setResult(e.data)
    
    return () => workerRef.current?.terminate()
  }, [])

  useEffect(() => {
    workerRef.current?.postMessage({ items })
  }, [items])

  return result
}
```

## Profiling

### Performance API

```typescript
// Measure specific operation
performance.mark('start-computation')
expensiveOperation()
performance.mark('end-computation')
performance.measure('computation', 'start-computation', 'end-computation')

// Get measurement
const [measure] = performance.getEntriesByName('computation')
console.log(`Computation took ${measure.duration}ms`)
```

### React DevTools Profiler

1. Open React DevTools → Profiler tab
2. Click record button
3. Interact with your app
4. Stop recording
5. Analyze flame graph and ranked chart

### Chrome DevTools

1. Open DevTools → Performance tab
2. Click record
3. Interact with app
4. Stop recording
5. Look for:
   - Long tasks (>50ms)
   - Layout thrashing (purple marks)
   - Excessive paints (green marks)
