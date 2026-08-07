# T4 — Seed data and unblocking work

**You own:** `db/002_seed.sql` and everything in it. Later: Twilio and the analytics
dashboard.

Your work comes **first** in wall-clock time and it is almost entirely about unblocking
other people. Nothing you build is on the demo's critical path until step 12, and
everything you seed is.

## Context pack — read these, in this order

Run `/t4` and this happens for you. Doing it by hand:

| Order | File | Why |
|---|---|---|
| 1 | `agents/status/T4.md` | where you left off — always first |
| 2 | this file | scope, boundaries, build order |
| 3 | `db/001_schema.sql` | every table you seed, and its constraints |
| 4 | `db/002_seed.sql` | what is already seeded — extend it, do not restart it |
| 5 | `Docs/Project_Vaidhya_Technical_Architecture_v1.md` §3.1–3.2 | ownership split and the schema rationale |
| 6 | `PROGRESS.md` | who is blocked on you right now |

## Build order → architecture section → files

From the V1 build plan §7 (~3h). **Arch §** is the section of
`Docs/Project_Vaidhya_Technical_Architecture_v1.md` that tells you how to build it.

| # | Task | Est | Arch § | Files | Status |
|---|---|---|---|---|---|
| 1 | **3 fake `diagnostic_reports` rows** | 1h | §7, §3.2 | `db/002_seed.sql` | ✅ done — unblocked T2 |
| 2 | Seed jurisdictions, patients, doctors | 1h | **§14**, §3.2 | `db/002_seed.sql` | ✅ done |
| 3 | Translation cache — ~20 phrasings × 4 languages | 1h | §3.2 (`question_bank`) | `db/002_seed.sql` | ✅ 5 seeded |
| 4 | Branching rules the engine can fire | — | **§6** | `db/002_seed.sql` | ✅ 7 seeded |
| p2 | Twilio SMS/IVR — demo step 12 | — | **§13** | `app/api/twilio/`, `scheduled_reminders` | phase 2 ⚠️ risk |
| p2 | Analytics dashboard — demo step 13 | — | **§12** | `app/(analytics)/dashboard/`, `regional_case_counts` | phase 2 |

Config keys: §15 (Node B block) — the `TWILIO_*` and `FOLLOW_UP_DELAY_SECONDS` keys.

The starter seed is already applied. Extending it — more patients, more rules, more
realistic transcripts — is high-value and low-risk work whenever you have a spare hour.

## Rules that are not negotiable

- **Every demo doctor serves every jurisdiction.** An unrealistic catchment area is a
  much smaller problem than an empty queue on stage.
- The seed must stay **idempotent** — every insert has an `on conflict` clause. Someone
  will run it twice at 3am.
- `question_bank` is a **translation cache, not a question source.** The LLM authors
  questions freely. A cache miss is normal. The system is correct with it empty.

## After V1 — the two deferred Core Requirements

Both are explicit requirements in `Docs/Problem_Statement.md`. Deferring them is correct
sequencing; forgetting them loses a judging criterion.

- **Twilio SMS/IVR** (demo step 12) — ⚠️ the highest external risk in the project.
  Indian DLT registration and Twilio trial restrictions can block SMS to Indian numbers
  for reasons that have nothing to do with your code. **Prove it end to end early.** If
  it cannot be proven, fall back to the WhatsApp sandbox or Twilio Voice/IVR and cut it
  from the critical demo path.
- **Analytics dashboard** (demo step 13) — anomaly precomputed into
  `regional_case_counts`. This is the closing shot of the demo.

## Demo steps you own

12, 13.
