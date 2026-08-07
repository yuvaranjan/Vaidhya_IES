# Progress board

<!-- GENERATED FILE — do not edit by hand.
     Edit your own agents/status/<lane>.md and run `npm run progress`.
     Merge conflict here? Take either side and regenerate. -->

Generated 2026-08-07T17:24:14Z from `agents/status/*.md` · protocol in [agents/README.md](agents/README.md)

## Right now

| Lane | Owner | State | Working on | Status file |
|---|---|---|---|---|
| **T1** | Yuvaranjan | 🔵 in progress | Scaffold landed; next is the LLM provider against LM Studio ⚠️ _never committed_ | `agents/status/T1.md` |
| **T2** | Yadav | 🔵 in progress | Scaffold landed; next is patient login ⚠️ _never committed_ | `agents/status/T2.md` |
| **T3** | unassigned | ⚪ not started | unassigned ⚠️ _never committed_ | `agents/status/T3.md` |
| **T4** | unassigned | 🔵 in progress | Starter seed written but not yet applied to a real Supabase project ⚠️ _never committed_ | `agents/status/T4.md` |

> ⚠️ means that lane's code has been committed more recently than its status file — the board is behind the work. Whoever owns it: update your file.

## Demo readiness — the §17 set-piece

**V1 path: 0 / 9 steps demonstrable.** All phases: 0 / 13.

A step counts only if it can be performed live, right now, in front of a judge.

| # | Step | Owner | Phase | Demonstrable |
|---|---|---|---|---|
| 1 | Unplug Node A's wifi, on camera ⭐ | T1 | v2 | — |
| 2 | Patient logs in, nurse enters vitals: SpO2 91, temp 38.9 | T2 | v1 | — |
| 3 | Voicebot greets and converses in Malayalam | T1 | v1 | — |
| 4 | Rules engine visibly branches on SpO2 91 | T1 | v1 | — |
| 5 | Nurse-finding request times out gracefully | T1 | v1 | — |
| 6 | Report generates — Urgent (2 flags) — with no internet ⭐ | T1 | v1 | — |
| 7 | Plug wifi back in — outbox flushes, patient appears in the doctor's queue tagged Urgent ⭐ | T1 | v2 | — |
| 8 | Doctor clicks Consult Specialist AI | T1 | v1 | — |
| 9 | Doctor types a question over MQTT; voicebot speaks it in Malayalam | T2 | v1 | — |
| 10 | Doctor issues a prescription; it appears immediately in the patient portal | T3 | v1 | — |
| 11 | Nearby pharmacies with per-medicine stock; patient picks one; it lands in that pharmacy's queue | T3 | v1 | — |
| 12 | Twilio medication reminder to a real phone, then the follow-up ~90s later | T4 | v2 | — |
| 13 | Close on the analytics dashboard: the anomaly spike, highlighted | T4 | v2 | — |

⭐ = one of the three steps that actually wins it: unplug the wifi, generate the report offline, plug back in and watch it sync into the doctor's queue.

## Blockers

- **T1** — Nobody has created the Supabase project yet. Until `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` exist, task 10 (report write) cannot be finished.
- **T1** — No HiveMQ cluster yet, so task 11 (MQTT) is unstartable and demo step 7 with it.
- **T2** — Supabase project does not exist yet, so login cannot be wired to real rows. Until then, work against `lib/mockAi.ts` and hardcode a patient id.
- **T3** — T2 must land the doctor prescription form (task 10) before there is a prescription to display. Until then, insert a row into `prescriptions` by hand and build against it.
- **T3** — Supabase project does not exist yet.

## Notes from other lanes — read before you write code

- **T1** — **T2:** every unimplemented endpoint returns `501` with `{"error":"not_implemented","owner":"T1","task":"<number>"}`. Point the real client at the live port whenever you like — you will get a clean, readable failure, not a connection refused.
- **T1** — **T2:** the contract in `packages/shared/http.ts` is mirrored exactly in `services/edge-ai/contracts.py`. It has not changed since it was frozen.
- **T1** — **T2:** the nurse answers a pending finding through `POST /vitals` with `phase: "on_demand"` — there is no separate endpoint.
- **T2** — **Everyone:** doctor routes are `/doctor/login`, `/doctor/queue`, `/doctor/consult/[visitId]`, `/doctor/prescribe/[visitId]`. Not the flat `(doctor)/login` the architecture doc shows — two route groups both resolving to `/login` is a Next.js build error.
- **T2** — **Everyone:** the theme lives in `globals.css`, not `tailwind.config.ts`. Tailwind v4 is CSS-first. Same token names as the build plan.
- **T2** — **T3:** agree with me on directory ownership under `apps/web/app/` before you add files. Proposal: you take `(patient)/prescription/**`, `(pharmacy)/**` and `api/pharmacies/**`; I take the rest.
- **T3** — Nothing yet.
- **T4** — Demo logins: patient `9000000001` with OTP `123456`; doctor `9100000001` with password `vaidhya123`. Full list in the README.
- **T4** — The seed is idempotent — every insert has an `on conflict` clause. Safe to re-run.
- **T4** — `stock_items.status` is a generated column. Never write it by hand.

## Lane detail

### T1 · Yuvaranjan · `services/edge-ai`

**Done**

- FastAPI service boots on `:8000` with CORS for `:3000`. Verified: `uvicorn main:app --port 8000` then `curl /health` returns `{"llm":"down","stt":"down","tts":"down","translate":"ok","mqtt":"down"}` — the downs are correct, those providers are still stubs.
- `GET /session/{visit_id}/state` is live and returns a valid `SessionState` for an unknown visit instead of erroring. T2 can poll it today.
- Nurse-finding state machine (`voicebot/session.py :: resolve_pending`) implemented lazily from timestamps — no asyncio timers anywhere in the service.
- Rules engine condition parser (`rules/engine.py`) handles `<90`, `>=180`, `==true` without `eval`. Tiering: 0 flags routine, 1 elevated, 2+ urgent.
- Session store persists to SQLite (`edge.db`) so a uvicorn restart mid-demo survives.
- All `pip install -r requirements.txt` deps verified installing on Python 3.14.

**In progress**

- Nothing yet — scaffold just landed.

**Next**

- _nothing planned — this lane needs a plan_

Last self-reported update: 2026-08-07T22:45:00Z

### T2 · Yadav · `apps/web`

**Done**

- Next.js 15.5 + Tailwind v4 app builds clean (`npm run build` → 12 routes, `tsc --noEmit` exits 0).
- Theme tokens frozen at the top of `app/globals.css` as Tailwind v4 `@theme` — `bg-bg`, `bg-surface`, `border-border`, `bg-primary-500`, `text-text`, `text-muted`, `text-warn`, `text-danger`. Rules are in a comment above them.
- `lib/mockAi.ts` — five-turn scripted Malayalam conversation, nurse-finding pause on turn 3, urgency-flagged summary, in the exact contract shapes.
- `lib/edgeApi.ts` — the single switch point. `NEXT_PUBLIC_USE_MOCK_AI` flips the whole app between mock and real with no other change.
- `lib/mqtt.ts`, `lib/db.ts`, `lib/auth.ts` wired but unused so far.
- Every screen in the build plan has a route and a placeholder naming its task.

**In progress**

- Nothing yet — scaffold just landed.

**Next**

- _nothing planned — this lane needs a plan_

Last self-reported update: 2026-08-07T22:45:00Z

### T3 · unassigned · `apps/web/app/(patient)/prescription`

**Done**

- Pharmacies and stock are seeded (`db/002_seed.sql`): three pharmacies, ten stock rows, with Amala Medicals deliberately out of Paracetamol 500mg and Devi Pharmacy low on Amoxicillin. That gap is the point of the nearby-pharmacy screen — do not fix it.
- `pharmacies` has `latitude` / `longitude` columns ready for the haversine query.

**In progress**

- Nothing — lane unassigned.

**Next**

- _nothing planned — this lane needs a plan_

Last self-reported update: 2026-08-07T22:45:00Z

### T4 · unassigned · `db`

**Done**

- `db/001_schema.sql` — full schema, ordered so it applies top to bottom without a forward-reference error.
- `db/002_seed.sql` — idempotent starter seed: 2 jurisdictions, 4 patients, 2 doctors (bcrypt hash verified against `vaidhya123`), 7 branching rules, 3 pharmacies with 10 stock rows, 5 translation-cache phrasings.
- **Three visits already sitting in the doctor queue** with full diagnostic reports — one urgent appendicitis, one urgent hypoxia, one routine headache. This unblocks T2's queue and consult screens before T1's pipeline produces anything real.
- `db/edge_schema.sql` — SQLite mirror plus the outbox table, so the phase-2 offline story is a sync worker and nothing else.

**In progress**

- Nothing — lane unassigned.

**Next**

- _nothing planned — this lane needs a plan_

Last self-reported update: 2026-08-07T22:45:00Z

## Recent commits

```
6309026 · 07 Aug 22:36 · Scaffold the V1 spine: web app, edge-ai service, shared contracts, schema
30bf9dc · 07 Aug 22:36 · Move all planning documents into Docs/
dd328f2 · 07 Aug 21:40 · Updated questions
9d59d23 · 07 Aug 18:46 · Update Problem_Statement.md
afcbff5 · 07 Aug 18:31 · Update QuestionAnswer.md with new questions
93bab18 · 07 Aug 18:24 · Update QuestionAnswer.md
fe802d7 · 07 Aug 18:23 · Update QuestionAnswer.md
1600542 · 07 Aug 18:14 · Update QuestionAnswer.md with Q&A responses
```

---

Setup and one-click start: [SETUP.md](SETUP.md) · What to build: [Docs/Project_Vaidhya_V1_Build_Plan.md](Docs/Project_Vaidhya_V1_Build_Plan.md) · How it works: [Docs/Project_Vaidhya_Technical_Architecture_v1.md](Docs/Project_Vaidhya_Technical_Architecture_v1.md)
