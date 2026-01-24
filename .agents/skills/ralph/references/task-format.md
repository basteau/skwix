# Ralph Task Format

How to write task descriptions that future Ralph iterations can execute without context.

## Task Description Template

```
[One-line summary of what to implement]

**What to do:**
- Specific action 1
- Specific action 2
- Specific action 3

**Files:**
- path/to/file1.ts
- path/to/file2.ts

**Acceptance criteria:**
- Specific verifiable criterion
- Typecheck passes
- [For UI] Verify in browser using agent-browser

**Notes:**
- Follow pattern from [existing-file.ts]
- [Any other context needed]
```

## Example Task Description

```
Implement category name to ID mapping for expenses.

**What to do:**
- Create function mapExpenseCategoryNameToId(name, isChildExpense)
- Query item_category table with category_type filter
- Add alias mapping for common synonyms (rent → Rent or Mortgage)

**Files:**
- workflows/tools/upsert-expense.ts

**Acceptance criteria:**
- Function returns category ID for valid names
- Returns null for unknown categories
- Typecheck passes

**Notes:**
- Follow pattern from upsert-income.ts
- EXPENSE type for family, CHILD_EXPENSE for child
```

---

## Acceptance Criteria Guidelines

### Good Criteria (Verifiable)

- "Add `investorType` column to investor table with default 'cold'"
- "Filter dropdown has options: All, Cold, Friend"
- "Typecheck passes"
- "Tests pass"

### Bad Criteria (Vague)

- ❌ "Works correctly"
- ❌ "Good UX"
- ❌ "Handles edge cases"

### Always Include

```
Typecheck passes
```

### For Tasks with Testable Logic

```
Tests pass
```

### For UI/Browser Tasks

**Functional testing** (checking behavior):
```
Use agent-browser with snapshot -i to read page content
```
- `agent-browser snapshot -i` returns interactive elements with refs
- Use for: button exists, text appears, form works
- Example: `agent-browser snapshot -i | grep "Submit"` to verify button exists

**Visual testing** (checking appearance):
```
Use agent-browser screenshot to capture and verify visual appearance
```
- `agent-browser screenshot tmp/result.png` saves a screenshot
- Use for: layout, colors, styling, animations

---

## Example Conversation

**User:** set up ralph for adding expense tracking to the legal agent

**Assistant:** What feature are you building?

**User:** I want Grace (our legal chat agent) to be able to create, update, and delete expenses when users mention them in conversation.

**Assistant:** Got it - an expense upsert tool for the legal agent. A few questions:

1. Are there existing tools in the legal agent I should follow as a pattern?
2. Do expenses have different types (family vs child)?
3. Should it also list expenses or just CRUD?
4. Any task completion logic needed?

**User:** Follow upsert-income.ts. Yes family and child expenses (different tables). Yes list too. Mark APP_EXPENSES_ENTERED task complete.

**Assistant:** Perfect. Here's my proposed breakdown:

1. **Create tool skeleton** - Zod schema, basic structure
2. **Category mapping** - Map names like "rent" to category IDs
3. **Amount parsing** - Handle currency formats, allow $0
4. **Duplicate detection** - Check before creating
5. **Create family expenses** - Insert into expense table
6. **Create child expenses** - Insert into child_expense table
7. **Update action** - Modify existing expenses
8. **Delete action** - Remove expenses
9. **List action** - Show all expenses with totals
10. **Task completion** - Mark APP_EXPENSES_ENTERED done
11. **Register tool** - Add to legal chat workflow
12. **UI progress indicator** - Show progress during tool use
13. **Unit tests** - Test helper functions
14. **E2E tests** - Test via chat interface

Does this look right? Any tasks to add or remove?

**User:** Looks good, create the tasks

**Assistant:** [Creates parent task, then subtasks with dependencies, saves parent-task-id.txt]

✅ Ralph is ready!

**Parent task:** Legal Agent Expense Upsert Tool (ID: task-abc123)

**Subtasks:** 14 tasks created with dependencies

**To start:** Say "run ralph" or "start the loop"
