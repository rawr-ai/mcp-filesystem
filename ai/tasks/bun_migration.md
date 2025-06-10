# Bun Migration Tasks

This list tracks all tasks required to migrate the repository from Node/npm to the Bun runtime. Each heading corresponds to a Linear ticket and outlines the steps AI agents should perform.

## BUN-001 — Initialize Bun Environment
- Install Bun locally and inside dev containers.
- Run `bun install` to generate `bun.lockb` and commit it.
- No other files should be changed.

## BUN-002 — Port Package Management to Bun
- Replace `npm` scripts in `package.json` with `bun run` equivalents.
- Remove `package-lock.json` if present and regenerate dependencies using `bun install`.
- Commit the updated `package.json` and lockfile.

## BUN-003 — Create `bunfig.toml`
- Add a new `bunfig.toml` describing entry points and test configuration.
- Ensure `bun run build` and `bun test` read this configuration.

## BUN-004 — Update Build & Runtime Pipeline
- Replace direct usage of `tsc` with `bun build` (or `bun run tsc`).
- Ensure compiled output still goes to the `dist/` directory.

## BUN-005 — Migrate Dockerfile
- Use a Bun base image and install dependencies with `bun install`.
- Update the `ENTRYPOINT` to run the server with `bun` instead of `node`.

## BUN-006 — Update README & Documentation
- Update all command examples to use Bun (`bunx` or `bun run`).
- Document installation, build, and run steps using Bun.

## BUN-007 — Adapt Test Suite for Bun
- Ensure tests run via `bun test`.
- Verify Vitest or an alternative test runner works under Bun.
- Update `spec.md` or other test docs accordingly.

## BUN-008 — CI Pipeline Updates
- Modify CI workflows to use `bun install`, `bun run build`, and `bun test`.
- Update caching paths for Bun (e.g., `~/.bun`).

## BUN-009 — Compatibility Adjustments
- Audit dependencies for Bun compatibility and replace or remove Node-specific packages.
- Update imports if Bun provides built-in alternatives.

## BUN-010 — Finalize Migration
- Validate the application and tests under Bun.
- Tag a release candidate once everything runs cleanly.

Refer to `bun_migration_plan.md` for the full migration plan.
