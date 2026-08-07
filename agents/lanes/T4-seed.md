# T4 — Seed data and unblocking work

**You own:** `db/002_seed.sql` and everything in it. Later: Twilio and the analytics
dashboard.

Your work comes **first** in wall-clock time and it is almost entirely about unblocking
other people. Nothing you build is on the demo's critical path until step 12, and
everything you seed is.

## Build order (from the V1 build plan §7, ~3h)

| # | Task | Est | Why it is first |
|---|---|---|---|
| 1 | **3 fake `diagnostic_reports` rows** | 1h | ✅ done — unblocks T2 steps 8–9 immediately |
| 2 | Seed jurisdictions, patients, doctors | 1h | ✅ done — everyone needs login accounts |
| 3 | Translation cache — ~20 phrasings × 4 languages | 1h | ✅ 5 seeded; optional, the system runs empty |

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
