# Spec Authoring Guide — `specs/`

Specs are written **before** implementation to align decisions and serve as a reference during development. Keep them factual and decision-oriented — not a diary of exploration.

---

## Filename

`kebab-case-feature-name.md`

---

## Required Sections

### Header block
```
# Spec: <Feature Name>

**Status:** Draft | Approved | Done
**Date:** YYYY-MM-DD
**Feature:** One-line description
```

### Context
Why does this feature exist? What problem does it solve? One short paragraph.

### Decision
The chosen approach and its rationale. If alternatives were considered, list them in a table with reasons for rejection.

### Technical Spec
The implementation contract: component names, file paths, state shape, data flow, APIs, types. Use code blocks. Be precise.

### File Structure
A tree of all files to create or modify.

### Implementation To-Dos
Checkbox list. Mark items `[x]` as they are completed.

---

## Optional Sections

- **Dependencies** — new packages to install
- **Open Questions** — unresolved decisions (remove when answered)
- **References** — links to external docs or related files

---

## Rules

- Write the spec **before** touching code. The goal is to reach decisions, not document what was built.
- Each spec covers **one feature**. Cross-cutting concerns get their own file.
- Keep the status field current (`Draft → Approved → Done`).
- Mark To-Do items `[x]` as implementation progresses — the spec doubles as a task tracker.
