# Prompt Engineering Conventions

## Feature Prompts

Feature prompts are handed to Claude Code agents for implementation. They must be
fully self-contained — the receiving agent needs zero prior conversation context.

### Required structure

1. **Context** — what already exists, which files are relevant, current state
2. **Goal** — what the feature must achieve (outcomes, not implementation steps)
3. **Constraints** — non-negotiable rules the implementation must respect
4. **Acceptance criteria** — specific, testable, binary pass/fail statements
5. **Out of scope** — explicitly list what must NOT be changed
6. **Routing** — which agent(s) to invoke and in what order

### Non-negotiable rules

- Never include implementation code — describe intent, not solution
- Always include the review-first instruction:
  "Plan and report your approach before making any changes. Wait for approval."
- Always reference relevant skills the agent should load
- Experimental features must be flagged 🧪 with this note:
  "Must fail gracefully without breaking core blueprint generation."
- Where bundle discipline applies, state it explicitly:
  "In-app viewer: fully bundled, no CDN. HTML export: CDN only.
   Heavy deps (e.g. elkjs) must be second-level dynamic imports, lazy-loaded."

### Feature prompt template

```
@[agent]

Context
[What exists today. Relevant files. Current state.]

Goal
[What this feature must achieve. User-facing outcome.]

Constraints
- [Rule 1]
- [Rule 2]
Load skills: [list relevant skill files]

Acceptance Criteria
- [ ] [Specific, testable statement]
- [ ] [Specific, testable statement]

Out of Scope
- [What must not change]

Routing
Route to @architect first for interface design.
Then route to @developer for implementation.
Plan and report approach before making any changes.
```

---

## Verification Prompts

Verification prompts are read-only post-implementation audits. They confirm
correctness without making any changes.

### Non-negotiable rules

- Must include an explicit prohibition at the top:
  "READ ONLY. Do not modify any files."
- Checklist items must be concrete and binary (PASS / FAIL / WARN)
- Must cover: correctness, edge cases, error handling, and where relevant:
  bundle discipline (in-app vs HTML export parity)
- Assign to @reviewer for code quality or @security-auditor for security focus
- Always state the expected report format

### Verification prompt template

```
@[reviewer | security-auditor]

READ ONLY. Do not modify any files.

Purpose
[What was just implemented. What this audit confirms.]

Scope
Files to audit:
- [file path]
- [file path]

Checklist
- [ ] [Specific, testable check] — PASS / FAIL / WARN
- [ ] [Specific, testable check] — PASS / FAIL / WARN

Pass criteria
All items PASS or WARN. Any FAIL = blocked.

Report format
Number each result. State PASS / FAIL / WARN with a one-line reason.
End with overall verdict: APPROVED or BLOCKED.
```

---

## Anti-patterns

- Prompts that assume the agent has read previous conversation history
- Feature prompts that describe *how* to implement rather than *what* to achieve
- Verification prompts that do not include an explicit read-only prohibition
- Mixing feature spec and verification in a single prompt
- Vague acceptance criteria ("works correctly", "handles errors")

---

## Known examples in this project

- **ERD viewer verification prompt** — 20-check structure, covers layout engines,
  edge behaviour, export surface parity, bundle discipline. Reference for scope
  and specificity.
- **Cross-Entity Automation Detection evolution prompt** — feature prompt using
  Approach B (Full Trace) as the constrained choice. Reference for how to
  document a pre-decided architectural approach without prescribing implementation.
