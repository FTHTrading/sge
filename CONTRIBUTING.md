# Contributing to SGE Alignment OS

Welcome to the SGE Alignment OS monorepo. We welcome internal partner engineers and authorized external contributors. To ensure architectural integrity and audit chain consistency, all contributors must observe these guidelines.

## Development Workflow

1. **Pull Latest Main:** Before beginning work, ensure you are deeply synced with the upstream `main` branch.
2. **Branching Strategy:** Create a semantic branch (e.g., `feat/ai-voices`, `fix/audit-hash`, `ops/ci-cd`).
3. **Workspace Awareness:** Always run tests/lints across the entire Turborepo using `pnpm build` and `pnpm lint` before opening a Pull Request.

> [!TIP]
> Do not install dependencies using `npm` or `yarn`. This is a strict **pnpm** monorepo workspace.

## Commit Message Convention

Our CI/CD requires Conventional Commits syntax.
- `feat:` A new feature or module.
- `fix:` A bug fix.
- `docs:` Changes to documentation only.
- `refactor:` Code refactoring without behavioral changes.
- `chore:` Maintenance, DevOps, or non-visible updates.

## Pull Request Process

1. Open a PR pointing to `main`.
2. Ensure all GitHub Actions checks (Linting, TypeScript types, Build) pass successfully.
3. Your PR must specify if it modifies any Prisma Database Schemas (`packages/db/prisma/schema.prisma`). If it does, attach the relevant migration commands in your description.
4. At least one Senior Engineering sign-off is required before merging.

### Security Note
If your code touches RBAC logic, JWT sessions, or the immutable audit engine, request a direct security review (`@FTHTrading`).