# Coding standards

Most rules below are **enforced by tooling**. `pnpm check` (and CI) fails when they are broken.

## Files and size

| Rule                                    | Enforced by                               |
| --------------------------------------- | ----------------------------------------- |
| A source file has **at most 250 lines** | ESLint `max-lines` (error)                |
| A function should stay under ~80 lines  | ESLint `max-lines-per-function` (warning) |
| Cyclomatic complexity ≤ 10              | ESLint `complexity` (warning)             |

When a file grows, split it by responsibility. Move logic into a hook (`useLoginFlow`), split a component (`NoteList` → `NoteCard`), or move data access into a service (`notesRepository`).

## TypeScript

- TypeScript everywhere: apps, shared package, tests, build script and config files.
- `tsconfig.base.json` turns on `strict` plus `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals/Parameters`, `noPropertyAccessFromIndexSignature` and `verbatimModuleSyntax`.
- ESLint runs typescript-eslint's **strict-type-checked** and **stylistic-type-checked** presets.
- Use `import type` for type-only imports (`consistent-type-imports`).
- Exported functions in `api` and `shared` declare their return types (`explicit-module-boundary-types`). React components and hooks rely on inference.
- No `any`. Validate untrusted data with zod at the boundary (request bodies, path params, env vars) and use the inferred types from there on.

## Documentation (JSDoc / TSDoc)

- Every exported function, class, component, hook, interface and type alias has a doc comment (`jsdoc/require-jsdoc`, enforced by eslint-plugin-jsdoc).
- Document _why_ and any contract that is not obvious from the types: status codes, security checks, side effects.
- Use `@param`, `@returns`, `@throws` and `@example` where they add information.
- `pnpm docs:build` turns these comments into the HTML API reference in `docs/api/`.

## Naming and structure

| Kind             | Convention                                            | Example              |
| ---------------- | ----------------------------------------------------- | -------------------- |
| React components | `PascalCase.tsx`, named export                        | `NoteCard.tsx`       |
| Hooks            | `useCamelCase.ts`                                     | `useLoginFlow.ts`    |
| Other modules    | `camelCase.ts`                                        | `notesRepository.ts` |
| Lambda handlers  | `src/handlers/<functionName>.ts`, exporting `handler` | `getNote.ts`         |
| Constants        | `UPPER_SNAKE_CASE` for fixed limits                   | `NOTE_LIMITS`        |

- Prefer **named exports**; avoid default exports.
- The web app is organised **by feature** (`features/auth`, `features/notes`), with reusable primitives in `components/ui`.
- Components never call Amplify or `fetch` directly. They go through `authService`, `notesApi` and TanStack Query hooks.
- The Lambda handlers stay thin. Business rules live in `services/`, cross-cutting helpers in `lib/`.

## Formatting

- Prettier (`printWidth: 100`, trailing commas) formats everything. `.editorconfig` keeps editors consistent.
- `pnpm format` fixes formatting and `pnpm format:check` verifies it.

## Testing

- Vitest in every workspace. Tests live in `test/` (api, shared) or `src/test/` (web).
- API: mock AWS with `aws-sdk-client-mock`. Never call real AWS from unit tests.
- Web: test behaviour through the accessible UI (`getByRole`, `getByLabelText`) with Testing Library and user-event.
- Each bug fix adds a test that fails without the fix.

## Dependencies

- Versions are pinned once in the `catalog:` section of `pnpm-workspace.yaml`, and workspaces reference them with `"catalog:"`.
- Internal packages use `"workspace:*"`.
- pnpm only runs install scripts for packages listed in `allowBuilds`.
- TypeScript is held at 6.0.x because typescript-eslint and TypeDoc do not support the 7.x native compiler yet.

## Git workflow

- Run `pnpm check` before pushing; CI runs the same checks plus `terraform fmt` and `terraform validate`.
- Never commit `.env.local`, `*.tfstate` or AWS credentials (all are git-ignored).
