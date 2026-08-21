# Commit conventions

Using [Conventional Commits](https://www.conventionalcommits.org/) so the
git log stays readable as the project grows. Format:

```
<type>: <short summary, imperative mood>

<optional longer body — why, not just what>
```

## Types used in this repo

- `feat:` — new functionality (new package, new screen, new capability)
- `fix:` — bug fix (like the scheduler overflow fix)
- `chore:` — tooling, config, dependency bumps, non-functional scaffolding
- `docs:` — documentation-only changes (README, docs/, CONSTRAINTS.md)
- `refactor:` — restructuring without changing behavior
- `test:` — adding or fixing tests

## Examples from this project's history

```
chore: initial architecture scaffold
feat: TaskRepository abstraction + scheduler overflow tracking
fix: scheduler no longer silently drops tasks that don't fit
docs: update README for Milestone B status
```

## Rules of thumb

- One logical change per commit where practical — easier to revert if a
  free coding agent goes sideways on one specific thing.
- Summary line under ~70 chars, imperative mood ("add", not "added").
- If a change touches multiple packages for one reason (e.g. adding a
  shared type used by two packages), that's still one commit — it's one
  logical change.
- Reference the milestone in the body when relevant, e.g. "Part of
  Milestone B — see docs/architecture.md".
