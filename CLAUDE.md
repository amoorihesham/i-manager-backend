## Template Overview

Fastify REST API starter template for a complete production-ready application. Built with **TypeScript**, **Fastify v5**, **Drizzle ORM**, and **PostgreSQL**.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Fastify v5
- **Language**: TypeScript 6 (extends `fastify-tsconfig`)
- **ORM**: Drizzle ORM with `node-postgres` (`pg`) driver
- **Database**: PostgreSQL (Neon-compatible)
- **Validation**: Zod v4 (env schema uses `z.toJSONSchema()` for `@fastify/env`)

## Commands

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start dev server with `tsx --watch`        |
| `npm run build`    | Bundle with `tsup` (ESM output to `dist/`) |
| `npm run start`    | Run production build (`node dist/main.js`) |
| `npm run generate` | Generate Drizzle migrations                |
| `npm run migrate`  | Apply Drizzle migrations                   |
| `npm run studio`   | Open Drizzle Studio                        |
| `npm run lint`     | Run ESLint                                 |
| `npm run lint:fix` | Run ESLint with auto-fix                   |
| `npm run format`   | Format code with Prettier                  |

## Project Structure

```
src/
├── main.ts                  # Server entry point — starts the Fastify instance
├── app.ts                   # App factory (buildApp) — registers plugins, routes, error handler
├── config/
│   ├── env.ts               # Zod env schema + Fastify-compatible JSON schema export
│   └── constants.ts         # Shared constants (STATUS_CODES, PROCESS_EXIT_CODE)
├── db/
│   ├── connection.ts        # Singleton DB connection (Pool + Drizzle)
│   └── schemas/
│       ├── index.ts          # Barrel export for all table schemas
│       └── user.ts           # Users table definition
├── modules/
│   └── auth/
│       ├── auth.routes.ts    # Route registration (POST /register, /login)
│       ├── auth.controller.ts # Controller factory — receives DB, returns handlers
│       ├── auth.service.ts   # Service factory — receives DB, returns business logic
│       └── utils/            # Module-specific utilities (empty)
├── plugins/
│   └── authenticate.ts      # Auth preHandler — reads accessToken from cookies
├── types/
│   └── fastify.d.ts         # Module augmentation for FastifyInstance.config and FastifyRequest.
└── utils/
    └── error-handler.ts     # Global error handler (logs + returns 500)
```

## Architecture Patterns

### Module Pattern (Routes → Controller → Service)

Each feature module lives in `src/modules/<name>/` and follows a layered architecture:

1. **Routes** (`<name>.routes.ts`) — Registers Fastify routes, instantiates the controller with dependencies.
2. **Controller** (`<name>.controller.ts`) — Factory function that receives `Database`, creates the service, and returns request handlers.
3. **Service** (`<name>.service.ts`) — Factory function that receives `Database` and returns business logic methods.

Dependencies are injected via factory function arguments (not Fastify decorators).

### Database Access

- **Singleton pattern**: `createDatabaseConnection()` creates the pool once; `getDatabase()` retrieves it.
- Drizzle is initialized with the full schema for relational query support.
- DB schemas live in `src/db/schemas/` and are barrel-exported from `index.ts`.

### Environment Config

- Env vars are validated at startup via `@fastify/env` + a Zod schema converted to JSON Schema.
- Access env vars on the Fastify instance: `app.config.PORT`, `app.config.DATABASE_URL`, etc.
- Type augmentation in `src/types/fastify.d.ts` makes `app.config` fully typed.

### API Versioning

Routes are prefixed under `/api/v1`. A health check exists at `GET /api/v1/health`.

## Coding Conventions

- **ESM imports**: Always use `.js` extensions in import paths (TypeScript ESM requirement).
- **Path aliases**: Use `@/*` to reference `./src/*` (configured in `tsconfig.json`).
- **Formatting**: Prettier — single quotes, semicolons, trailing commas (`es5`), 2-space indent, 120 print width.
- **Linting**: ESLint with `eslint-config-love` + Prettier integration. Magic numbers and console usage are allowed.
- **Constants over literals**: Use `STATUS_CODES` and `PROCESS_EXIT_CODE` instead of raw numbers.
- **Type-only imports**: Use `import type { ... }` for types that are not used at runtime.
- **Error handling**: All unhandled errors go through the global error handler in `src/utils/error-handler.ts`.

## Environment Variables

Defined in `.env` (see `.env.example`):

| Variable                | Type     | Description                           |
| ----------------------- | -------- | ------------------------------------- |
| `NODE_ENV`              | `string` | `development` / `production` / `test` |
| `PORT`                  | `number` | Server port                           |
| `DATABASE_URL`          | `string` | PostgreSQL connection string          |
| `DATABASE_POOL_SIZE`    | `number` | Max DB pool connections               |
| `JWT_SECRET`            | `string` | Secret for JWT signing                |
| `JWT_ACCESS_TOKEN_TTL`  | `number` | Access token TTL (ms)                 |
| `JWT_REFRESH_TOKEN_TTL` | `number` | Refresh token TTL (ms)                |

## Adding a New Module

1. Create `src/modules/<name>/` with `<name>.routes.ts`, `<name>.controller.ts`, `<name>.service.ts`.
2. If the module needs DB tables, add schema files in `src/db/schemas/` and re-export from `index.ts`.
3. Register the routes in `src/app.ts` inside the versioned prefix group.
4. Run `npm run generate` then `npm run migrate` for any new schemas.
