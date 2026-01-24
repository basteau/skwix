# React Router v7 API Reference

## Router Setup

### createBrowserRouter

Creates router for browser environments using History API.

```typescript
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: RootError,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "users/:userId", Component: User },
    ],
  },
]);

// Render
<RouterProvider router={router} fallbackElement={<Spinner />} />
```

### Route Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | URL path segment |
| `index` | `boolean` | Index route (default child) |
| `Component` | `React.ComponentType` | Route component |
| `ErrorBoundary` | `React.ComponentType` | Error boundary component |
| `children` | `RouteObject[]` | Nested routes |
| `lazy` | `() => Promise<RouteObject>` | Lazy load route |

## Navigation Hooks

### useNavigate

Programmatic navigation.

```typescript
const navigate = useNavigate();

navigate("/users");           // Push
navigate("/users", { replace: true }); // Replace
navigate(-1);                 // Back
navigate(1);                  // Forward
navigate("/login", { state: { from: location } }); // With state
```

### useLocation

Current location object.

```typescript
const location = useLocation();

location.pathname  // "/users/123"
location.search    // "?tab=posts"
location.hash      // "#section"
location.state     // { from: "/dashboard" }
location.key       // unique key
```

### useParams

URL parameters from dynamic segments.

```typescript
// Route: /users/:userId/posts/:postId
const { userId, postId } = useParams<{ userId: string; postId: string }>();
```

### useSearchParams

URL search parameters (query string).

```typescript
const [searchParams, setSearchParams] = useSearchParams();

// Read
const page = searchParams.get("page");        // "1" or null
const tags = searchParams.getAll("tag");      // ["react", "router"]

// Write
setSearchParams({ page: "2" });               // Replace all
setSearchParams((prev) => {                   // Update
  prev.set("page", "2");
  return prev;
});
```

### useNavigation

Global navigation state.

```typescript
const navigation = useNavigation();

navigation.state      // "idle" | "loading" | "submitting"
navigation.location   // Location being navigated to
navigation.formData   // FormData if submitting
navigation.formAction // Action URL if submitting
navigation.formMethod // HTTP method if submitting
```

## Components

### Link

Declarative navigation.

```typescript
<Link to="/users">Users</Link>
<Link to="/users/123">User 123</Link>
<Link to={{ pathname: "/users", search: "?sort=name" }}>Sorted</Link>
<Link to=".." relative="path">Back</Link>
<Link replace>Replace History</Link>
<Link state={{ from: "dashboard" }}>With State</Link>
```

### NavLink

Link with active state styling.

```typescript
<NavLink
  to="/dashboard"
  className={({ isActive, isPending }) =>
    isActive ? "active" : isPending ? "pending" : ""
  }
  style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
  end  // Only active on exact match
>
  Dashboard
</NavLink>
```

### Navigate

Redirect component.

```typescript
// In component render
if (!user) {
  return <Navigate to="/login" replace state={{ from: location }} />;
}
```

### Outlet

Renders child route component.

```typescript
function Layout() {
  return (
    <div>
      <Header />
      <Outlet />  {/* Child route renders here */}
      <Footer />
    </div>
  );
}
```

### Outlet with Context

Pass context to child routes.

```typescript
function Layout() {
  const user = useUser();
  return <Outlet context={{ user }} />;
}

// In child route
function Dashboard() {
  const { user } = useOutletContext<{ user: User }>();
}
```

## Error Handling

### useRouteError

Access error in ErrorBoundary.

```typescript
function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // Response thrown (404, 500, etc.)
    return <div>{error.status}: {error.statusText}</div>;
  }

  if (error instanceof Error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>Unknown error</div>;
}
```

### isRouteErrorResponse

Check if error is a Response object.

```typescript
import { isRouteErrorResponse } from "react-router-dom";

if (isRouteErrorResponse(error)) {
  error.status;     // 404
  error.statusText; // "Not Found"
  error.data;       // Response body
}
```

## Lazy Loading

Load route components on demand.

```typescript
{
  path: "dashboard",
  lazy: async () => {
    const { Dashboard } = await import("./pages/Dashboard");
    return { Component: Dashboard };
  },
}

// Can also lazy load ErrorBoundary
{
  path: "admin",
  lazy: async () => {
    const module = await import("./pages/Admin");
    return {
      Component: module.Admin,
      ErrorBoundary: module.AdminError,
    };
  },
}
```

## Type Definitions

```typescript
import type {
  RouteObject,
  LoaderFunctionArgs,
  ActionFunctionArgs,
  Location,
  NavigateFunction,
  Params,
} from "react-router-dom";
```
