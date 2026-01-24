use recursive handoff skill to iteratively do this:
- implement the next open ticket (ticket skill)
- check AGENTS.md and use compound skill to retrieve knowledge + understand codebase + look at commits
- use bullet tracer skill to implement the ticket completely.
- review each ticket using amp-review skill, ios-simulator-pwa-testing skill and frontend design skill if relevant.
- update everything that surfaced from the reviews
- ensure that all project's qa and tests pass without errors
- commit changes
- compound knowledge that is not directly reflected in the code or commit history

do this until no tickets are left. skip steps that are not applicable to the ticket. 
frequently send status updates using chef skill
