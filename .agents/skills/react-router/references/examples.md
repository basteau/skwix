# React Router v7 + Convex Examples

## Complete CRUD Example

```typescript
// pages/Todos.tsx
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../convex/_generated/api";

export function Todos() {
  const todos = useQuery(api.todos.list);
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const deleteTodo = useMutation(api.todos.remove);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = new FormData(form).get("title") as string;
    await createTodo({ title });
    form.reset();
  }

  if (todos === undefined) return <p>Loading...</p>;

  return (
    <div>
      <h1>Todos</h1>

      <form onSubmit={handleCreate}>
        <input name="title" placeholder="New todo" required />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo._id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo({ id: todo._id })}
            />
            <Link to={`/todos/${todo._id}`}>{todo.title}</Link>
            <button onClick={() => deleteTodo({ id: todo._id })}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Detail Page with Update/Delete

```typescript
// pages/TodoDetail.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function TodoDetail() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();

  const todo = useQuery(
    api.todos.get,
    todoId ? { id: todoId as Id<"todos"> } : "skip"
  );
  const updateTodo = useMutation(api.todos.update);
  const deleteTodo = useMutation(api.todos.remove);

  if (todo === undefined) return <p>Loading...</p>;
  if (todo === null) return <p>Not found. <Link to="/todos">Back</Link></p>;

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateTodo({
      id: todo!._id,
      title: formData.get("title") as string,
    });
  }

  async function handleDelete() {
    await deleteTodo({ id: todo!._id });
    navigate("/todos");
  }

  return (
    <div>
      <Link to="/todos">← Back</Link>
      <h1>{todo.title}</h1>

      <form onSubmit={handleUpdate}>
        <input name="title" defaultValue={todo.title} required />
        <button type="submit">Update</button>
      </form>

      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

## Protected Routes with Auth

```typescript
// components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useConvexAuth } from "convex/react";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Router config
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      {
        Component: ProtectedRoute,
        children: [
          { path: "dashboard", Component: Dashboard },
          { path: "projects", Component: Projects },
          { path: "projects/:projectId", Component: Project },
        ],
      },
    ],
  },
]);
```

## Login with Redirect Back

```typescript
// pages/Login.tsx
import { useLocation, useNavigate } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAction(api.auth.signIn);

  const from = (location.state as { from?: Location })?.from?.pathname || "/dashboard";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await signIn({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    navigate(from, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## URL Search Params for Filters

```typescript
import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function ProjectsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "all";

  const projects = useQuery(api.projects.list, {
    status: status === "all" ? undefined : status,
  });

  return (
    <div>
      <select
        value={status}
        onChange={(e) => setSearchParams({ status: e.target.value })}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>

      {projects === undefined ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p._id}>
              <Link to={`/projects/${p._id}`}>{p.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Lazy Loading Routes

```typescript
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      {
        path: "dashboard",
        lazy: async () => {
          const { Dashboard } = await import("./pages/Dashboard");
          return { Component: Dashboard };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const { Settings } = await import("./pages/Settings");
          return { Component: Settings };
        },
      },
    ],
  },
]);
```

## Error Boundaries

```typescript
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
        <Link to="/">Go Home</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

// Router config
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: ErrorBoundary,
    children: [/* ... */],
  },
]);
```

## Layout with Navigation State

```typescript
import { Outlet, Link, useNavigation } from "react-router-dom";

function Layout() {
  const navigation = useNavigation();

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
      </nav>
      {navigation.state === "loading" && <p>Loading...</p>}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```
