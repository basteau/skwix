# Bundle Size Optimization

Strategies to reduce bundle size in Vite React applications.

## Barrel File Problem

Barrel files (`index.ts` that re-exports) cause bundlers to load entire libraries.

### Problematic Libraries

| Library | Direct Import Path |
|---------|-------------------|
| `lucide-react` | `lucide-react/dist/esm/icons/{icon}` |
| `@mui/material` | `@mui/material/{Component}` |
| `@mui/icons-material` | `@mui/icons-material/{Icon}` |
| `react-icons` | `react-icons/{set}/{Icon}` |
| `@radix-ui/react-*` | Use individual packages |
| `lodash` | `lodash/{function}` |
| `date-fns` | `date-fns/{function}` |
| `@headlessui/react` | Import specific components |

### Examples

```typescript
// ❌ Loads ~1500 icons
import { Check, X } from 'lucide-react'

// ✅ Loads 2 icons
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'

// ❌ Loads entire MUI
import { Button, TextField } from '@mui/material'

// ✅ Loads 2 components
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ❌ Loads all lodash
import { debounce, throttle } from 'lodash'

// ✅ Loads 2 functions
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
```

### Vite Plugin for Auto-Transform

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'lodash': 'lodash-es',
    },
  },
  optimizeDeps: {
    include: ['lodash-es'],
  },
})
```

## Code Splitting with React.lazy

### Basic Usage

```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### Named Exports

```typescript
// HeavyComponent.tsx exports: export function HeavyComponent() {}

const HeavyComponent = lazy(() =>
  import('./HeavyComponent').then(mod => ({ default: mod.HeavyComponent }))
)
```

### Route-Based Splitting

```typescript
import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
```

### Conditional Loading

```typescript
function FeaturePanel({ enabled }: { enabled: boolean }) {
  const [Component, setComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (enabled && !Component) {
      import('./HeavyFeature')
        .then(mod => setComponent(() => mod.HeavyFeature))
        .catch(() => console.error('Failed to load feature'))
    }
  }, [enabled, Component])

  if (!enabled) return null
  if (!Component) return <Skeleton />
  return <Component />
}
```

## Preloading Strategies

### On User Intent

```typescript
const preloadEditor = () => void import('./MonacoEditor')

function EditorButton({ onClick }: Props) {
  return (
    <button
      onMouseEnter={preloadEditor}
      onFocus={preloadEditor}
      onClick={onClick}
    >
      Open Editor
    </button>
  )
}
```

### On Visibility

```typescript
function LazySection() {
  const ref = useRef<HTMLDivElement>(null)
  const [Component, setComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          import('./HeavySection').then(mod => setComponent(() => mod.default))
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {Component ? <Component /> : <Placeholder />}
    </div>
  )
}
```

### On Idle

```typescript
function App() {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        void import('./Analytics')
        void import('./ErrorTracking')
      })
    } else {
      setTimeout(() => {
        void import('./Analytics')
        void import('./ErrorTracking')
      }, 2000)
    }
  }, [])
}
```

## Third-Party Scripts

### Defer Non-Critical Scripts

```typescript
function Analytics() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://analytics.example.com/script.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return null
}

// Load after hydration
function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <MainContent />
      {mounted && <Analytics />}
    </>
  )
}
```

### Dynamic Script Loading

```typescript
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = reject
    document.body.appendChild(script)
  })
}

// Usage
async function initMaps() {
  await loadScript('https://maps.googleapis.com/maps/api/js?key=...')
  // Maps API is now available
}
```

## Analyzing Bundle Size

### Vite Bundle Analyzer

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      filename: 'bundle-stats.html',
      gzipSize: true,
    }),
  ],
})
```

### Source Map Explorer

```bash
npm install -D source-map-explorer

# Build with source maps
npm run build

# Analyze
npx source-map-explorer dist/assets/*.js
```

## Vite Optimizations

### Manual Chunks

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

### Split by Route

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          if (id.includes('/pages/')) {
            const match = id.match(/\/pages\/([^/]+)/)
            if (match) return `page-${match[1]}`
          }
        },
      },
    },
  },
})
```

## Tree Shaking Tips

### Use ES Modules

```typescript
// ❌ CommonJS - can't tree shake
const { format } = require('date-fns')

// ✅ ESM - tree shakeable
import { format } from 'date-fns'
```

### Avoid Side Effects in Modules

```typescript
// ❌ Has side effect - can't be removed
import './setup'  // Runs code on import

// ✅ Pure module - can be tree shaken
import { setup } from './setup'
setup()  // Explicit call
```

### Mark Packages as Side-Effect Free

```json
// package.json
{
  "sideEffects": false
}

// Or specify files with side effects
{
  "sideEffects": ["./src/polyfills.ts", "*.css"]
}
```

## Quick Wins Checklist

- [ ] Replace barrel imports with direct imports
- [ ] Use React.lazy for routes and heavy components
- [ ] Preload on hover/focus for interactive elements
- [ ] Defer analytics/tracking to after hydration
- [ ] Use `lodash-es` instead of `lodash`
- [ ] Analyze bundle with visualizer
- [ ] Configure manual chunks for vendor code
- [ ] Remove unused dependencies
