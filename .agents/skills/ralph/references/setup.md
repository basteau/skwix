# Ralph Setup Workflow

Detailed setup instructions for both modes.

## Mode 1: New Feature Setup

### Step 1: Understand the Feature

Start by asking:
```
What feature are you building?
```

Then clarify:
- What's the user-facing goal?
- What parts of the codebase will this touch? (database, UI, API, etc.)
- Are there any existing patterns to follow?
- What should it look like when done?

**Keep asking until you have enough detail to break it into tasks.**

### Step 2: Break Into Tasks

**Typical order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Integration / E2E tests

### Step 3: Create Tasks

**First, create the parent task:**

```
task_list create
  title: "[Feature Name]"
  description: "[One-line description of the feature]"
  repoURL: "<repo-url>"
```

**Save the returned task ID** - you'll need it for subtasks.

**Then, create subtasks with parentID and dependsOn:**

```
task_list create
  title: "[Task title - action-oriented]"
  description: "[See task-format.md for template]"
  parentID: "<parent-task-id>"
  dependsOn: ["<previous-task-id>"]  // omit for first task
  repoURL: "<repo-url>"
```

### Step 4: Run Final Setup

See "Final Setup" section below.

### Step 5: Confirm

```
✅ Ralph is ready!

**Parent task:** [title] (ID: [id])

**Subtasks:**
1. [Task 1 title] - no dependencies
2. [Task 2 title] - depends on #1
3. [Task 3 title] - depends on #2
...

**To start:** Say "run ralph" or "start the loop"
```

---

## Mode 2: Existing Tasks Setup

### Find the Parent Task

**First, check if a parent task is already saved:**

```bash
cat scripts/ralph/parent-task-id.txt
```

If this file exists and contains a task ID, verify it:
```
task_list action: "get", taskID: "<id-from-file>"
```

**Only if no saved parent task exists**, ask the user:
```
What's the parent task? You can give me:
- The task ID directly
- A search term and I'll find it
- Or say "list recent" to see recent tasks
```

### Verify Subtasks

```
task_list list
  parentID: "<parent-task-id>"
  limit: 10
```

If no subtasks found, ask:
```
This task has no subtasks. Is this:
1. A parent task with subtasks I should find differently?
2. The actual work task (I should create it as a parent with this as the first subtask)?
```

### Check Dependencies

Verify:
- Do they have `dependsOn` set correctly?
- Are there any circular dependencies?
- Is the first task(s) dependency-free so Ralph can start?

If dependencies are missing, offer to fix:
```
These tasks don't have dependencies set. Should I:
1. Add dependencies based on their order?
2. Leave them parallel (Ralph picks any ready task)?
```

### Run Final Setup

See "Final Setup" section below.

### Show Status

```
✅ Ralph is ready to use existing tasks!

**Parent task:** [title] (ID: [id])

**Status:**
- ✅ Completed: 3 tasks
- 🔄 Ready to work: 2 tasks
- ⏳ Blocked: 5 tasks (waiting on dependencies)

**Next task Ralph will pick:**
[Task title] - [brief description]

**To start:** Say "run ralph" or "start the loop"
```

---

## Final Setup (Required for Both Modes)

**ALWAYS run these steps after creating tasks OR setting up existing tasks:**

### 1. Save parent task ID

```bash
echo "<parent-task-id>" > scripts/ralph/parent-task-id.txt
```

Verify:
```bash
cat scripts/ralph/parent-task-id.txt
```

### 2. Check if progress.txt needs archiving

```bash
cat scripts/ralph/progress.txt
```

**Archive if:**
- It has content beyond the header (learnings from a previous feature)
- The previous feature is different from the current one

**Archive command:**
```bash
DATE=$(date +%Y-%m-%d)
FEATURE="previous-feature-name-here"
mkdir -p scripts/ralph/archive/$DATE-$FEATURE
cp scripts/ralph/progress.txt scripts/ralph/archive/$DATE-$FEATURE/
echo "Archived to scripts/ralph/archive/$DATE-$FEATURE/"
```

### 3. Reset progress.txt

**Preserve useful Codebase Patterns** from the previous run, then reset:

```bash
cat > scripts/ralph/progress.txt << 'EOF'
# Ralph Progress Log
Started: [current date]

## Codebase Patterns
[Copy any patterns from previous run that are still relevant]
---
EOF
```

### 4. Verify setup is complete

```bash
# Confirm parent ID is saved
cat scripts/ralph/parent-task-id.txt

# Confirm progress.txt is reset
head -10 scripts/ralph/progress.txt

# List subtasks to confirm they exist
# (use task_list list with parentID)
```

**Only after completing all 4 steps is Ralph ready to run.**

---

## Checklist Before Running

- [ ] Chatted through feature to understand scope
- [ ] Each task completable in one iteration (small enough)
- [ ] Tasks ordered by dependency (schema → backend → UI → tests)
- [ ] Every task has "typecheck passes" in description
- [ ] UI tasks have browser verification in description
- [ ] Descriptions have enough detail for Ralph to implement without context
- [ ] Parent task ID saved to scripts/ralph/parent-task-id.txt
- [ ] Previous run archived if progress.txt had content
