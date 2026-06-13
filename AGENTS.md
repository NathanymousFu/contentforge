# ContentForge — Agent Guide

## Monorepo Layout

```
apps/web/          Next.js 16 App Router (port 3001)
packages/api/      oRPC routers, context, auth config (shared business logic)
packages/db/       Prisma schema + client (PostgreSQL via pg adapter)
packages/env/      t3-env validation (separate web.ts and server.ts)
packages/ui/       shadcn/ui primitives (import as @contentforge/ui/components/*)
packages/config/   Shared tsconfig.base.json
```

## Essential Commands

- `bun run dev` — Start all apps (port **3001**, not 3000)
- `bun run dev:web` — Start only the Next.js app
- `bun run db:push` — Push Prisma schema to DB (no migration files)
- `bun run db:generate` — Regenerate Prisma client
- `bun run db:studio` — Open Prisma Studio
- `bun x ultracite fix` — Format + lint fix (run before commits)
- `bun x ultracite check` — Check for issues
- `bun run check-types` — TypeScript type-check all packages

## Environment

- `.env` lives at `apps/web/.env` (not repo root)
- Required: `DATABASE_URL`, `CORS_ORIGIN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Server env validated in `packages/env/src/server.ts`, web in `packages/env/src/web.ts`

## Database

- PostgreSQL via `@prisma/adapter-pg` (Supabase-style connection string)
- Prisma client instantiated in `packages/db/src/index.ts` as `createPrismaClient()`
- Schema in `packages/db/prisma/schema/` (split across `.prisma` files)
- Generated client at `packages/db/prisma/generated/`
- `prisma.config.ts` uses relative path to `apps/web/.env` for DATABASE_URL

## oRPC API Pattern

1. Context created by `createContext()` in `packages/api/src/context.ts` — receives `NextRequest`, returns `{ session }` from NextAuth `getServerSession`
2. Routers defined in `packages/api/src/routers/` — add new router to `index.ts`
3. Route handler at `apps/web/src/app/api/rpc/[[...rest]]/route.ts` — uses `RPCHandler` + `OpenAPIHandler`
4. Client setup in `apps/web/src/utils/orpc.ts` — exports `client` (raw) and `orpc` (TanStack Query utils)
5. Procedure types: `publicProcedure` (no auth), `protectedProcedure` (requires session)

## Auth (NextAuth v4)

- Config at `packages/api/src/lib/auth-options.ts` (shared between context and route handler)
- Route handler at `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Session types augmented in `apps/web/src/types/next-auth.d.ts`
- Middleware at `apps/web/src/middleware.ts` protects `/dashboard/*` and `/projects/*`
- `SessionProvider` wraps app in `providers.tsx`

## shadcn/ui Conventions

- Import shared components: `@contentforge/ui/components/button`
- Never import from `@/components/ui/` — primitives live in `packages/ui`
- App-specific blocks go in `apps/web/src/components/`
- Add shared primitives: `npx shadcn@latest add <name> -c packages/ui`

## Code Style (Biome)

- Indent: tabs, quotes: double, `verbatimModuleSyntax: true`
- `useSortedClasses` enforced for Tailwind class names
- `useExhaustiveDependencies` set to `info` (not error)
- `noUnusedLocals` / `noUnusedParameters` enabled in base tsconfig
- Never use `any` — prefer `unknown`

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.
