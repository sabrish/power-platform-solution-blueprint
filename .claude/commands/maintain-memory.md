/agent document-updater

Maintenance pass on .claude/memory/project.md.

Current file is getting long. Apply these rules to trim it:

1. "What's Working" section: collapse any features that have been stable for 2+
   versions into a single summary line: "Stable baseline (vX.Y+): [one-line summary
   of what's fully working]" — do not list every individual feature
2. "Next Steps": remove any item that now appears in "What's Working"
3. "In Progress": remove anything that shipped in the current version
4. "Known Limitations": keep in full — do not collapse
5. Target: under 150 lines total

Before writing anything:
- Show me the current line count
- Show me what would be collapsed and what would be removed
- Show me the projected new line count
- Wait for my approval

After approval, write the updated file and confirm the new line count.

```
Maintenance complete.
project.md trimmed ✅
Line count under 150 ✅
```
