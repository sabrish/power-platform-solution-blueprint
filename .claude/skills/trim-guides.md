/agent document-updater

Cross-reference and trim task.

Compare these two files against both domain pattern files:
- DATAVERSE_OPTIMIZATION_GUIDE.md → compare against .claude/memory/patterns-dataverse.md
- UI_PATTERNS.md → compare against .claude/memory/patterns-ui.md

For each section in those files:
1. Check if the content is fully captured by a named PATTERN-XXX in the relevant
   domain pattern file
2. If yes: propose replacing the section with a one-line reference:
   "See PATTERN-XXX in .claude/memory/patterns-dataverse.md (or patterns-ui.md) — [pattern name]"
3. If the guide section has nuance NOT captured in the pattern file: flag it for my
   review but do not modify it

Before writing anything:
- Show me the full list: which sections would be replaced, which would be flagged
- Show me the projected line count reduction for each file
- Wait for my approval

After approval, make only the approved replacements. Do not touch flagged sections.
Report: lines removed from each file, sections replaced, sections flagged.
