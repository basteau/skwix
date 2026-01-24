# Ralph Execution Loop

The autonomous loop that implements tasks one by one.

## Loop Workflow

### 0. Get the Parent Task ID

```bash
cat scripts/ralph/parent-task-id.txt
```

If this file doesn't exist, ask the user which parent task to work on.

**Check if this is a new feature:** Compare the parent task ID to the one in `scripts/ralph/progress.txt` header. If they differ (or progress.txt doesn't exist), reset progress.txt:

```markdown
# Build Progress Log
Started: [today's date]
Feature: [parent task title]

## Codebase Patterns
(Patterns discovered during this feature build)

---
```

### 1. Check for Ready Tasks

The task hierarchy may have multiple levels (parent → container → leaf tasks).

**Step 1: Get all tasks for the repo**
```
task_list action: "list", repoURL: "<repo-url>", ready: true, status: "open", limit: 10
```

**Important:** Always use `limit` (5-10) to avoid context overflow.

**Step 2: Build the descendant set**
1. Find tasks where `parentID` equals the parent task ID (direct children)
2. For each child found, recursively find their children
3. Continue until no more descendants are found

**Step 3: Filter to workable tasks**
From the descendant set, select tasks that are:
- `ready: true` (all dependencies satisfied)
- `status: "open"`
- Leaf tasks (no children of their own)

**CRITICAL:** Skip container tasks that exist only to group other tasks.

### 2. If No Ready Tasks

Check if all descendant tasks are completed:
- Query `task_list list` with `repoURL: "<repo-url>"` (no ready filter)
- Build the full descendant set
- If all leaf tasks are `completed`:
  1. Archive progress.txt:
     ```bash
     DATE=$(date +%Y-%m-%d)
     FEATURE="feature-name-here"
     mkdir -p scripts/ralph/archive/$DATE-$FEATURE
     mv scripts/ralph/progress.txt scripts/ralph/archive/$DATE-$FEATURE/
     ```
  2. Create fresh progress.txt with empty template
  3. Clear parent-task-id.txt: `echo "" > scripts/ralph/parent-task-id.txt`
  4. Commit: `git add scripts/ralph && git commit -m "chore: archive progress for [feature-name]"`
  5. Mark the parent task as `completed`
  6. Stop and report "✅ Build complete - all tasks finished!"
- If some are blocked: Report which tasks are blocked and why

### 3. If Ready Tasks Exist

**Pick the next task:**
- Prefer tasks related to what was just completed (same module/area)
- If no prior context, pick the first ready task

**Execute the task via handoff:**

```
Implement and verify task [task-id]: [task-title].

[task-description]

FIRST: Read scripts/ralph/progress.txt - check the "Codebase Patterns" section for important context from previous iterations.

When complete:

1. Run quality checks: typecheck and tests (use project's commands from AGENTS.md)
   - If either fails, FIX THE ISSUES and re-run until both pass
   - Do NOT proceed until quality checks pass

2. Update AGENTS.md files if you learned something important:
   - Check for AGENTS.md in directories where you edited files
   - Add learnings that future developers/agents should know
   - This is LONG-TERM memory
   - Do NOT add task-specific details or temporary notes

3. Update progress.txt (APPEND, never replace):
   ## [Date] - [Task Title]
   Thread: [current thread URL]
   Task ID: [task-id]
   - What was implemented
   - Files changed
   - **Learnings for future iterations:**
     - Patterns discovered
     - Gotchas encountered
   ---

4. If you discovered a reusable pattern for THIS FEATURE, add it to the `## Codebase Patterns` section at the TOP of progress.txt

5. Commit all changes with message: `feat: [Task Title]`

6. Mark task as completed: `task_list action: "update", taskID: "[task-id]", status: "completed"`

7. Invoke the ralph skill to continue the loop
```

---

## Progress File Format

```markdown
# Build Progress Log
Started: [date]
Feature: [feature name]
Parent Task: [parent-task-id]

## Codebase Patterns
(Patterns discovered during this feature build)

---

## [Date] - [Task Title]
Thread: https://ampcode.com/threads/[thread-id]
Task ID: [id]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

**Note:** When a new feature starts with a different parent task ID, reset progress.txt completely. Long-term learnings belong in AGENTS.md files.

---

## Task Discovery

While working, **liberally create new tasks** when you discover:
- Failing tests or test gaps
- Code that needs refactoring
- Missing error handling
- Documentation gaps
- TODOs or FIXMEs in the code
- Build/lint warnings
- Performance issues

Use `task_list action: "create"` immediately. Set appropriate `dependsOn` relationships.

---

## Important Notes

- Always use `ready: true` when listing tasks to only get tasks with satisfied dependencies
- Always use `limit: 5-10` when listing tasks to avoid context overflow
- Each handoff runs in a fresh thread with clean context
- Progress.txt is the memory between iterations - keep it updated
- Prefer tasks in the same area as just-completed work for better context continuity
- The handoff goal MUST include instructions to update progress.txt, commit, and re-invoke this skill
