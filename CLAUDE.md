# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript strict mode)
- **Supabase** — PostgreSQL with RLS, Auth (cookie-based sessions)
- **Tailwind CSS v4** + shadcn/ui components
- **Vitest** + React Testing Library
- **Vercel** for deployment, Blob for file storage
- **Resend** for transactional email

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint
npm run format           # Prettier format
npm run type-check       # TypeScript check
npm run test             # Run all tests
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Coverage report
```

**Single test file:** `npm test -- tests/path/to/file.test.ts`

Always capture test output to a file and filter from there — don't rerun the suite to inspect output differently:

```bash
npm test -- --reporter=verbose 2>&1 | tee /tmp/test-out.txt
grep -E "FAIL|Error|✗" /tmp/test-out.txt
```

## Architecture

```
/app              # Next.js App Router pages & API routes
/components/ui    # shadcn/ui base components
/lib
  /actions        # Server actions by domain (videos, users, auth, email, etc.)
  /supabase       # Supabase clients (server.ts, client.ts, middleware.ts)
  /utils          # Shared utilities
/types            # TypeScript type definitions
/tests            # Vitest tests (mirrors source structure)
/migrations       # SQL migration files
/docs             # Project documentation
```

## Key Patterns

### Supabase Clients

Never create inline Supabase clients. Always use the shared helpers:

```typescript
// Server components / server actions
import { createServerClient } from '@/lib/supabase/server'
const supabase = await createServerClient()

// Client components
import { createBrowserClient } from '@/lib/supabase/client'
```

A service-role client (bypasses RLS) is available for admin-level DB operations — use sparingly and only in server actions.

### Server Actions

All business logic lives in `/lib/actions/*.ts`, organized by domain. Prefer extending existing files over creating new ones.

### Authentication & Authorization

- Four roles: `student`, `teacher`, `head_teacher`, `admin`
- Middleware (`lib/supabase/middleware.ts`) enforces approval status and role-based route access with a **15-minute cached approval check** to reduce DB queries
- `ADMIN_USER` env var is a bootstrap/fallback for admin access in middleware only — not a database role
- Admin authorization uses role checks (`role === "admin"`), not hardcoded emails
- RLS policies enforce data isolation per role and school at the DB layer; never use localStorage for persistence

### Caching

- `unstable_cache` with named tags for server data (e.g., `revalidateTag("videos")` to invalidate)
- User-specific or time-sensitive data (favorites, view counts) is fetched client-side with SWR

### Debugging

Prefer `TraceLogger` over `console.log` — logs persist in the database and are viewable via the admin UI:

```typescript
import { TraceLogger } from '@/lib/trace-logger'
const trace = new TraceLogger('ComponentName')
trace.log('Operation description', { relevantData })
```

Temporary `console.log` statements should be prefixed `[v0]` and removed after debugging.

### Components

- Default to Server Components; add `'use client'` only when required
- Use design tokens for colours (`bg-background`, `text-foreground`) and `gap-*` for spacing between children (not margins)

## Shared Utilities

| Purpose | Import |
|---------|--------|
| Server Supabase client | `@/lib/supabase/server` → `createServerClient()` |
| Browser Supabase client | `@/lib/supabase/client` → `createBrowserClient()` |
| Trace logging | `@/lib/trace-logger` → `TraceLogger` |
| Date formatting | `@/lib/utils/date` |
| Auth utilities | `@/lib/utils/auth` |
| CSS class merging | `@/lib/utils` → `cn()` |

## Testing

Tests live in `/tests` mirroring source structure. Mocks for Supabase and Next.js navigation are in `/tests/mocks`. Coverage threshold is 50% across all metrics.

## Workflow

### Git context check (before anything else)
Run `git branch --show-current` and `gh pr list --state open` before touching any files.
- If on main with no open PR: create a feature branch first — `git fetch origin main && git checkout -b <branch> origin/main`
- If a feature branch or open PR already exists: all changes go on that branch, no exceptions
- Only one PR open at a time. Never create a second PR while one is active.

### Planning & Execution (Superpowers)
Use Superpowers for all planning and execution:
1. `brainstorming` skill — refine requirements before any code
2. `writing-plans` skill — detailed, task-level implementation plan
3. `subagent-driven-development` skill — execute with two-stage review

TDD is mandatory throughout: RED-GREEN-REFACTOR, no exceptions.
Do not use /ce-brainstorm, /ce-plan, or /ce-work.

### Review & Compounding (Compound Engineering)
After implementation is complete and a PR exists:
1. `/ce-code-review` — parallel specialist review of the PR
2. `/ce-compound` — document the solved problem for future sessions

The `docs/solutions/` folder is CE's knowledge store and will grow over time.
The `docs/superpowers/` folder is Superpowers' store — do not mix them.
