/agent document-updater

Maintenance pass on .claude/memory/decisions.md.

Some decisions are now so fundamental they no longer need full rationale loaded into
every agent's context — they are simply how the project works. Identify these and
propose collapsing them.

A decision is a collapse candidate if:
- It has Status: Accepted and has been implemented for 2+ versions
- Its rationale is not needed to understand current constraints
- The key constraint (the "what" not the "why") is already captured in learnings.md
  or the domain pattern files (`.claude/memory/patterns-dataverse.md`, `.claude/memory/patterns-ui.md`)

For each candidate, in sequence:
1. Show me the full decision entry
2. Propose a collapsed one-paragraph summary to replace it
3. Propose which section of docs/architecture.md it should move to for archiving
4. Wait for my explicit approval before writing anything

After all approvals:
- Replace each approved entry in decisions.md with its summary
- Append the full original entries to docs/architecture.md under a section called
  "## Architecture Decision Records (Archived)" — create the section if it doesn't exist
- Report: how many decisions reviewed, how many collapsed, new line counts for both files

```
Maintenance complete.
Entries reviewed ✅
Decisions collapsed ✅/⏭️ (if none ready)
Archived to docs/architecture.md ✅
```
