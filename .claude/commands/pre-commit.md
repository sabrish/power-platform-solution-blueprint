---
name: pre-commit
description: Pre-commit gate invoked by the orchestrator before any git commit. Runs reviewer then security-auditor in sequence. Not invoked directly by the project owner — the orchestrator calls this when you say "ready to commit" or similar.
---

/agent orchestrator

Pre-commit gate. Run in this exact order — do not skip steps.

**Files in scope:** $ARGUMENTS
(If no files specified, ask the project owner which files are being committed before proceeding.)

## Step 0: Build Verification

Before invoking any agent, confirm with the project owner that both of the following commands have been run and passed since the last code change:

1. `pnpm typecheck`
2. `pnpm build`

If either has NOT been run or did NOT pass — stop immediately. Report:
"Build verification required: please run `pnpm typecheck && pnpm build` and confirm both pass before continuing."
Do not proceed to Step 1 until the project owner confirms both commands passed.

## Step 1: Reviewer

Invoke the reviewer agent with the files listed above.
- The reviewer reads learnings.md first — any violation is an automatic blocker
- The reviewer works through the full review checklist
- Wait for the reviewer's verdict before proceeding to Step 2

If the reviewer returns ❌ Changes required:
- Stop. Report the blockers to the project owner.
- Do NOT proceed to the security audit.
- Wait for the developer to fix the blockers, then the project owner must re-invoke this skill.

## Step 2: Security Auditor

Only run if Step 1 returned ✅ Approved or ⚠️ Approved with comments.

Invoke the security-auditor with scope limited to the files being committed.

## Step 2b: Memory Audit (Always runs — unconditional)

Invoke the **security-auditor** scoped exclusively to `.claude/memory/`.

This runs regardless of what files are being committed and regardless of the
Step 1 verdict. Memory files can accumulate sensitive data (connection strings,
tenant IDs, credentials) captured from session context without the project owner
noticing. This audit catches that.

## Step 3: Combined Verdict

Report to the project owner:

```
## Pre-Commit Gate Result

**Reviewer:** [✅ Approved | ⚠️ Approved with comments | ❌ Changes required]
**Security Audit (committed files):** [✅ CLEAN | ⚠️ FINDINGS REQUIRE ACTION | ❌ CRITICAL — blocked]
**Memory Audit (.claude/memory/):** [✅ CLEAN | ⚠️ FINDINGS REQUIRE ACTION | ❌ CRITICAL — blocked]

**Verdict:** [CLEAR TO COMMIT | COMMIT WITH CAVEATS: [list] | BLOCKED: [list blockers]]

**Suggested git add:**
git add [list the files that passed]

**Hold back (needs fixing first):**
[any files with unresolved blockers]
```

Never run git add or git commit yourself. Always hand the commands to the project owner.
