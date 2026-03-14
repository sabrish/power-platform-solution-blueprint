/agent skills-learner

Maintenance pass on .claude/memory/learnings.md.

Review every entry and identify candidates for promotion to the appropriate domain
pattern file — these are entries that have been in learnings.md for multiple sessions
and have not been violated since they were added. Stable, proven behaviour belongs in
the domain pattern files, not as an active correction.

Work through this sequence for each candidate:
1. Show me the full learning entry
2. Determine which file it belongs in:
   - Dataverse API, OData, GUID handling, batching, auth, build, commits →
     .claude/memory/patterns-dataverse.md
   - React, Fluent UI v9, makeStyles, UI behaviour →
     .claude/memory/patterns-ui.md
3. Propose the formatted PATTERN-XXX entry (matching the style of existing patterns in
   the target file — include Source, Applies to, description, code example, Do NOT section)
4. Wait for my explicit approval ("yes", "approved", "looks good") before writing anything

After each approved promotion:
- Append the new pattern to the correct domain file using the next available
  PATTERN number
- Replace the full learning entry in .claude/memory/learnings.md with this single line:
  "Promoted → PATTERN-XXX in patterns-dataverse.md (or patterns-ui.md) ([YYYY-MM-DD])"

Rules:
- Never promote without explicit approval for each entry
- Never auto-number — check the highest existing PATTERN-XXX across BOTH
  patterns-dataverse.md and patterns-ui.md before assigning a number
- If nothing is ready for promotion, say so and stop
- After finishing, report: how many entries reviewed, how many promoted,
  new line count of learnings.md
