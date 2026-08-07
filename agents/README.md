# Agent protocol

Read this before you write code. It takes two minutes and it is the difference
between four people building one system and four people building four systems.

Four teammates are vibe-coding this repo in parallel, each with an AI agent. Nobody
has time to read anyone else's code. So the rule is:

> **Your lane's status file is the interface to your work.** If it isn't in there,
> as far as the team is concerned it doesn't exist.

---

## The one file you own

| Lane | Person | Code area | Status file — **you alone write this** |
|---|---|---|---|
| T1 | Yuvaranjan | `services/edge-ai/` (+ `apps/web/app/api/specialist/`) | `agents/status/T1.md` |
| T2 | Yadav | `apps/web/` | `agents/status/T2.md` |
| T3 | — | pharmacy + prescription delivery | `agents/status/T3.md` |
| T4 | — | `db/` seed data | `agents/status/T4.md` |

Never edit another lane's status file. If you need something from another lane, put
it under **Blocked / needs from another lane** in your own file — it surfaces on
their board automatically.

`PROGRESS.md` at the repo root is **generated** from these four files. Do not hand-edit
it; your changes will be overwritten on the next run. If it ever conflicts in a merge,
take either side and run `npm run progress`.

---

## When to update your status file

Update it **at the end of every working session, before you stop** — and immediately
whenever any of these happen:

- you finish something another lane is waiting on
- you get blocked on another lane
- you change something in `packages/shared/` or `services/edge-ai/contracts.py`
  (that's the contract — it affects everyone)
- you complete one of the twelve demo steps in `agents/demo-steps.json`
- you discover something that would surprise the person reading your code later

A Stop hook regenerates `PROGRESS.md` automatically and will nag you once per session
if your status file is older than your last code change. The nag is the floor, not
the standard.

---

## How to write a good entry

The reader is a teammate at 2am who will not open your source files. Write for them.

**Done** — what actually works, in behaviour, not in nouns. Say how you know.

> ✅ `POST /voice/turn` accepts a webm blob and returns Malayalam audio + English
> transcript. Verified with `requests.http` request 3 against a real recording.
>
> ❌ Implemented the turn loop.

**In progress** — one line, the thing you are touching right now, so nobody else
touches it.

**Next** — the next two or three things, in order. This is what someone picks up if
you fall asleep.

**Blocked / needs from another lane** — name the lane and be specific about the shape
of what you need.

> ⛔ T4: need `branching_rules` seeded before the rules engine can fire anything.

**Notes for other lanes** — anything that changes how someone else writes their code:
a contract change, a gotcha, a decision, a field that turned out to be nullable.

Keep the whole file under a screen. Delete stale bullets rather than accumulating them;
git history is the archive, this file is the current state.

---

## The frontmatter is machine-read — keep it valid

```yaml
---
lane: T1
owner: Yuvaranjan
area: services/edge-ai
state: in_progress        # not_started | in_progress | blocked | done
now: One line — what you are doing right this minute
demo_steps_done: [2, 3]   # step numbers from agents/demo-steps.json you can demo NOW
updated: 2026-08-07T22:40:00Z
---
```

`demo_steps_done` is the one that matters most. It is how the team knows how close the
§17 demo actually is, and it is the only honest measure of progress this project has.
Only list a step you could perform **live, right now, in front of a judge**. A step that
works "except for one thing" is not done.

---

## What we are building toward

Everything in this repo exists to make one seven-minute sequence possible — the demo
set-piece in §17 of the technical architecture, enumerated in `agents/demo-steps.json`.

The three steps that actually win it: **1** (unplug the wifi on camera), **6** (report
generates with no internet), **7** (plug back in, it syncs, patient appears in the
doctor's queue). A working offline flow that syncs on reconnect is a claim almost no
hackathon team can back up live.

When you are deciding what to build next, the tiebreak is always: *which demo step does
this move?* If the answer is none, it is phase 2.

---

## Files

```
agents/
├─ README.md            this file — the protocol
├─ demo-steps.json      the twelve §17 steps, with an owner each
├─ lanes/               per-lane briefs: scope, boundaries, definition of done
│  ├─ T1-edge-ai.md     T2-portal.md · T3-pharmacy.md · T4-seed.md
└─ status/              THE LIVING STATE — one file per lane, single writer each
   ├─ T1.md · T2.md · T3.md · T4.md
   └─ _template.md
```

Related: `PROGRESS.md` (generated board) · `SETUP.md` (install and run) ·
`Docs/Project_Vaidhya_V1_Build_Plan.md` (what to build) ·
`Docs/Project_Vaidhya_Technical_Architecture_v1.md` (how it works, §17 is the goal).
