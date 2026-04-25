---
name: create-new-module
description: use when user ask to create a new module inside this project.
---

## Prerequisites

The module **must** follow the project's architecture and coding standards:

1. **File Structure**:
   ```
   src/
   └── modules/
       └── new-module/                            # Module name (kebab-case)
           ├── types/                             # TypeScript types (Zod schemas)
           ├── utils/                             # Utils related to this module
           ├── schemas/                           # Zod schemas this module
           ├── new-module.controller.ts           # Request handlers (logic)
           ├── new-module.service.ts              # Business logic (optional, for complex logic)
           └── new-module.routes.ts               # Module entry point (export routes)
   ```

## **Always ask for clarification if:**

- The user doesn't specify the module name
- If this module will have database models (tables)
- If the user doesn't specify database table names
- If the user doesn't specify database table fields
- If the user doesn't specify the prefix for the module routes
- If the user doesn't specify the routes for the module

## Naming Conventions

- **File names**: `dot.case.extension` (e.g., `product.service.ts`, `user.routes.ts`)
- **Module folders**: `kebab-case` (e.g., `products`, `users`)
- **Public functions**: `camelCase` (e.g., `getUserById`, `createProduct`)
- **Private functions**: `_privateFunctionName` (leading underscore)

## Best Practices

- Follow the project's ESLint and Prettier rules

---

$ARGUMENTS
