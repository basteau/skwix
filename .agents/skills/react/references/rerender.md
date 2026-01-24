# Re-render Optimization Patterns

Complete guide to preventing unnecessary re-renders in React v19.

## Core Concepts

React re-renders a component when:
1. Its state changes
2. Its parent re-renders (unless memoized)
3. Context it subscribes to changes

## Memoization Strategies

### When to Use memo()

```typescript
// ✅ GOOD - expensive computation, stable props
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />)
})

// ❌ BAD - cheap component, props change frequently
const SimpleLabel = memo(function SimpleLabel({ text }: { text: string }) {
  return <span>{text}</span>
})
```

**Use memo when:**
- Component has expensive render logic
- Component receives stable props
- Parent re-renders frequently

**Skip memo when:**
- Component is cheap to render
- Props change on every render anyway
- Using React Compiler (auto-memoizes)

### Fix Broken Memoization

```typescript
// ❌ Default value breaks memoization
const Button = memo(function Button({ onClick = () => {} }: Props) {
  return <button onClick={onClick}>Click</button>
})

// ✅ Stable default value
const NOOP = () => {}
const Button = memo(function Button({ onClick = NOOP }: Props) {
  return <button onClick={onClick}>Click</button>
})
```

```typescript
// ❌ Inline object breaks memoization
<MemoizedComponent style={{ color: 'red' }} />

// ✅ Stable object
const style = { color: 'red' }
<MemoizedComponent style={style} />

// ✅ Or useMemo if dynamic
const style = useMemo(() => ({ color: theme.primary }), [theme.primary])
<MemoizedComponent style={style} />
```

### useMemo vs memo

```typescript
// useMemo - memoize VALUE within component
function List({ items }: Props) {
  const sorted = useMemo(() => items.sort(compare), [items])
  return sorted.map(item => <Item key={item.id} item={item} />)
}

// memo - memoize COMPONENT to skip re-render
const Item = memo(function Item({ item }: { item: ItemType }) {
  return <div>{item.name}</div>
})
```

### Don't Over-Memoize

```typescript
// ❌ useMemo for simple expressions
const isLoading = useMemo(() => user.isLoading || posts.isLoading, [user.isLoading, posts.isLoading])

// ✅ Just compute it
const isLoading = user.isLoading || posts.isLoading
```

**useMemo is worth it when:**
- Creating new objects/arrays passed to memoized children
- Expensive computation (sorting, filtering large lists)
- Computing derived data from large datasets

## State Management

### Functional Updates

```typescript
// ❌ Creates new callback on every items change
const addItem = useCallback((item: Item) => {
  setItems([...items, item])
}, [items])

// ✅ Stable callback, always uses latest state
const addItem = useCallback((item: Item) => {
  setItems(curr => [...curr, item])
}, [])

// Common patterns
setCount(c => c + 1)
setItems(items => [...items, newItem])
setItems(items => items.filter(i => i.id !== id))
setMap(map => new Map(map).set(key, value))
```

### Lazy Initialization

```typescript
// ❌ Expensive on every render
const [data, setData] = useState(expensiveComputation(props))

// ✅ Expensive only on mount
const [data, setData] = useState(() => expensiveComputation(props))

// Common use cases
useState(() => JSON.parse(localStorage.getItem('key') ?? '{}'))
useState(() => new Map(initialEntries))
useState(() => buildSearchIndex(documents))
```

### Avoid State for Derived Data

```typescript
// ❌ Redundant state
function FilteredList({ items }: Props) {
  const [filteredItems, setFilteredItems] = useState(items)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setFilteredItems(items.filter(i => i.name.includes(query)))
  }, [items, query])
}

// ✅ Compute during render
function FilteredList({ items }: Props) {
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(query)),
    [items, query]
  )
}
```

## Effect Dependencies

### Use Primitives

```typescript
// ❌ Re-runs on any user change
useEffect(() => {
  trackPageView(user.id)
}, [user])

// ✅ Re-runs only when id changes
useEffect(() => {
  trackPageView(user.id)
}, [user.id])
```

### Derive Booleans First

```typescript
// ❌ Runs on every width change
useEffect(() => {
  if (width < 768) setMobileMode(true)
}, [width])

// ✅ Runs only on boolean transition
const isMobile = width < 768
useEffect(() => {
  if (isMobile) setMobileMode(true)
}, [isMobile])
```

### Defer Reads

```typescript
// ❌ Subscribes to params, re-renders on every change
function ShareButton() {
  const params = useSearchParams()
  
  const share = () => {
    const ref = params.get('ref')
    shareContent({ ref })
  }
}

// ✅ Reads on demand, no subscription
function ShareButton() {
  const share = () => {
    const params = new URLSearchParams(window.location.search)
    shareContent({ ref: params.get('ref') })
  }
}
```

## Context Optimization

### Split Contexts

```typescript
// ❌ All consumers re-render on any change
const AppContext = createContext({ user: null, theme: 'light', settings: {} })

// ✅ Consumers only re-render for their context
const UserContext = createContext(null)
const ThemeContext = createContext('light')
const SettingsContext = createContext({})
```

### Memoize Context Value

```typescript
// ❌ New object every render
function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ✅ Stable object
function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState('light')
  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### Select from Context

```typescript
// ❌ Re-renders on any store change
function UserName() {
  const store = useContext(StoreContext)
  return <span>{store.user.name}</span>
}

// ✅ Use selector pattern (with useSyncExternalStore or library)
function UserName() {
  const name = useStoreSelector(state => state.user.name)
  return <span>{name}</span>
}
```

## Transitions

### Non-Urgent Updates

```typescript
import { startTransition } from 'react'

// Scroll/resize handlers
window.addEventListener('scroll', () => {
  startTransition(() => setScrollPosition(window.scrollY))
}, { passive: true })

// Search input
function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)  // Urgent - update input
    startTransition(() => {
      setResults(filterItems(e.target.value))  // Can be deferred
    })
  }
}
```

### With Pending State

```typescript
function SearchResults() {
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState([])

  const search = async (query: string) => {
    startTransition(async () => {
      const data = await fetchResults(query)
      setResults(data)
    })
  }

  return (
    <>
      <input onChange={(e) => search(e.target.value)} />
      {isPending ? <Spinner /> : <Results data={results} />}
    </>
  )
}
```

## React v19: Activity Component

For expensive components that toggle visibility:

```typescript
import { Activity } from 'react'

function Modal({ isOpen, children }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <div className="modal">{children}</div>
    </Activity>
  )
}
```

**Benefits:**
- Preserves component state when hidden
- Preserves DOM (no unmount/remount)
- Skips rendering when hidden

## Debugging Re-renders

### React DevTools Profiler

1. Open React DevTools → Profiler
2. Click "Highlight updates when components render"
3. Interact with your app
4. Look for unexpected highlights

### Why Did You Render

```typescript
// Development only
import whyDidYouRender from '@welldone-software/why-did-you-render'

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, { trackAllPureComponents: true })
}

// Mark specific components
MyComponent.whyDidYouRender = true
```

### Console Logging

```typescript
function Component({ prop1, prop2 }: Props) {
  console.log('Component render', { prop1, prop2 })
  
  useEffect(() => {
    console.log('Effect ran - prop1 changed')
  }, [prop1])
}
```
