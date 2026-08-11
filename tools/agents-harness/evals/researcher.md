# Eval: researcher — dated claim with citations

## Run

Spawn `researcher` with a question whose answer is on an official, dated schedule and drifts over time, e.g.:

> As of today (<date>): which Node.js major version line is Active LTS, and which line is Current? Cite official sources (nodejs.org or the nodejs/Release GitHub schedule) with the dates the claims are based on. Fetch at most 4 pages.

## Answer key

Check against https://raw.githubusercontent.com/nodejs/Release/main/schedule.json at run time. (2026-08-07: Active LTS = v24 "Krypton", Current = v26, Maintenance LTS = v22.)

## Rubric

- **Pass**: correct lines, every claim carries a source URL, dates stated, inference vs. quoted fact distinguished, no vote/recommendation (judging is refuter's job).
- **Partial**: correct but citations incomplete or dates missing.
- **Fail**: wrong line, uncited claims, or answers from memory without fetching.
