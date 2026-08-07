# Cross-lane integration pass — 2026-08-08

Shared record, not lane-owned. Written by T1 (Yuvaranjan) after an integration pass
that deliberately crossed lane boundaries at the project owner's direction, because
the lanes had each built against their own mocks and the seams between them had come
apart. Normal lane rules resume after this.

`agents/status/T1.md` is still the authority for T1's own work. This file exists so
T2, T3 and T4 can see what changed **in their areas** without reading a 1,100-line
diff. Nothing here was committed by the lane that owns it — check the changes before
you build on them.

Full diff: 30 files changed, +1116 / −338, plus 5 new files.

---

## Read this first if you are…

**T2 (Yadav) — two things will surprise you:**

1. **The doctor login password changed.** It used to accept the hardcoded string
   `doctor123` and set `doctorId = "doctor_mock_001"`. It now bcrypt-compares against
   the seeded `doctors.password_hash` and sets the real `doc_001`. **The demo password
   is `vaidhya123`** (phone `9100000001`) — that is what the README and T4's seed
   always said; the login screen was the thing out of step. The mock branch is kept
   for laptops with no `.env.local`, and it uses `vaidhya123` too.
2. **`lib/mockQueue.ts` is no longer what the doctor screens read.** They now read
   `lib/queue.ts`, which is Supabase-backed with identical function signatures and
   an automatic fallback to your mock when `db` is null. **Your UI components were
   not modified** beyond a type import rename — `QueueClient`, `ConsultClient` and
   `PrescriptionClient` render exactly as you built them.

**T3 — your Supabase path was never running.** Three routes embedded `patients(*)`
directly on `prescriptions`. That foreign key does not exist (the path is
`prescriptions → visits → patients`), so PostgREST rejected the whole query, your
`catch` swallowed it, and you got mock rows stamped with real prescription ids. It
looked like it worked. It did not. Details in §3.

**T4 — `db/edge_schema.sql` gained a `branching_rules` table.** Same 7 rules as
`002_seed.sql`. If you change a rule there, change it here too.

---

## 1 · Contract changes (frozen file — both mirrors edited together)

`packages/shared/http.ts` and `services/edge-ai/contracts.py`. Both additive; nothing
that ignores them breaks.

| Added | Why |
|---|---|
| `SessionState.doctor_question?: DoctorQuestion \| null` | The patient browser has no MQTT connection. The doctor's question is translated and voiced on the edge, then collected on the 2s poll the consult page already makes. |
| `VitalsRequest.patient_id?`, `VitalsRequest.language?` | Pass One vitals are submitted on `/intake`, before the language picker on `/consult` runs `/session/start`. These let `/vitals` open the visit itself instead of 404-ing. |

New type `DoctorQuestion { message_id, text_en, text_native, audio_url, asked_at }`.

---

## 2 · T1 · `services/edge-ai/**` (own lane — summary only, see T1.md)

- **`POST /vitals` implemented** (`vitals_store.py`, new). It was a 501 stub, which
  meant `rules/engine.py` was called by nothing and every report tiered `routine / 0`.
- **Outbox sync worker** (`sync/worker.py`, new). The outbox was write-only and
  `builder.py` never contacted Supabase at all.
- **MQTT actually connects** (`mqtt_client.py` rewritten, `consult.py` new).
  `mqtt.connect()` was never called from anywhere; `_on_message` only logged.
- **Translation fix** (`providers/translate.py`) — the prompt passed the language
  *code* (`ml`), which a small model answers by rephrasing in English.
- `clock.py` (new) — ISO timestamps, because Postgres `timestamptz` rejects the
  `str(time.time())` floats that were being written.
- New endpoints: `GET /sync/status`, `POST /sync/flush`. `/consult/ask` implemented.

---

## 3 · T3 · pharmacy routes — the silent-mock bug

Three files, one root cause. `prescriptions` has a foreign key to `doctors` but
**not** to `patients`; the patient is reached through `visits`.

| File | Was | Now |
|---|---|---|
| `app/api/pharmacies/nearby/route.ts` | `.select("*, patients(*)")` | `.select("*, visits(patient_id, patients(home_jurisdiction_id))")` |
| `app/api/pharmacies/queue/route.ts` | `.select("*, prescriptions(*, patients(*), doctors(*))")` | `.select("*, prescriptions(*, doctors(*), visits(patient_id, patients(*))))")` |
| `app/api/pharmacies/prescription/route.ts` | `.select("*, doctors(*), patients(*)")` | `.select("*, doctors(*), visits(patient_id, patients(*))")` |

Also changed in all three:

- The swallowed error now **logs** (`console.error`) before falling back. A fallback
  that leaves no trace is why this survived.
- Hardcoded personal-data defaults removed. `patient_name: item.prescriptions.patients?.name || "Anjali Menon"`
  meant a failed lookup silently displayed a real seeded patient's name on someone
  else's prescription. Now `?? "Unknown patient"`, and age/sex/phone default to `null`.
- `follow_up_requested` defaulted to `true` on a miss; now `false`.

**Observed before the fix:** a 1-medicine prescription rendered in the pharmacist
portal as the seeded 3-medicine one, under the correct prescription id.

Not touched, but worth your check: `app/api/pharmacies/route/route.ts`,
`app/api/pharmacies/stock/route.ts`, `app/api/prescriptions/[id]/route/route.ts`,
`lib/mockDb.ts`, `components/PharmacistPortal.tsx`, `components/PrescriptionView.tsx`,
`app/(patient)/prescription/[id]/page.tsx`.

---

## 4 · T2 · `apps/web/**` — data swapped, UI preserved

The instruction was *Yadav's UI is preferred*, so every change below is behind the
render layer. No JSX was restyled and no theme token was touched.

### 4.1 New file — `lib/queue.ts`

Supabase-backed replacement for `lib/mockQueue.ts`, same signatures:

| mockQueue | queue.ts | Note |
|---|---|---|
| `getMockQueue()` | `getQueue()` | now `async` |
| `getMockVisit(id)` | `getVisit(id)` | now `async` |
| `claimVisitCAS(id, doc)` | `claimVisit(id, doc)` | now `async`; real Postgres CAS |
| `completeVisit(id, meds)` | `completeVisit(id, meds)` | now `async` |
| `type MockVisit` | `type Visit` (aliased `MockVisit`) | identical shape |

The claim is `.update(...).eq("visit_id", id).eq("status", "awaiting_doctor")`. The
second `.eq` **is** the compare-and-swap — Postgres applies it atomically, so the
losing doctor updates zero rows and gets the 409. Read-then-write would have raced.
`lib/mockQueue.ts` is retained and still used as the no-Supabase fallback.

### 4.2 Two ordering bugs found while verifying

Both would have broken demo step 2 and silently downgraded step 6.

1. `/intake` posts vitals but `sessionStart` only runs later on `/consult` → the
   readings hit a session that did not exist. Fixed by letting `/vitals` open the
   visit (needs the new `patient_id` field, §1).
2. **`/session/start` constructed a fresh `Session`, discarding the vitals and
   urgency flags the nurse had just entered.** A 2-flag visit came out `routine`.
   It now reuses an in-flight session and only updates `language`/`patient_id`.

Verified in the broken order — vitals → session/start → intake/complete still yields
`urgent / 2 flags`.

### 4.3 File-by-file

| File | Change |
|---|---|
| `app/(doctor)/doctor/login/actions.ts` | Real bcrypt against `doctors.password_hash`; real `doctor_id`. **Password is now `vaidhya123`, not `doctor123`.** Needed because `visits.claimed_by_doctor_id` and `prescriptions.doctor_id` are foreign keys — `"doctor_mock_001"` could never satisfy them. |
| `app/(patient)/login/actions.ts` | Looks up `patient_id` by phone instead of hardcoding `"9000000001"` (a phone number, not an id). **Unknown numbers are now rejected**; previously any phone worked with OTP `123456`. |
| `app/(doctor)/doctor/(dashboard)/queue/actions.ts` | Points at `lib/queue`; `await`s the claim. |
| `…/queue/page.tsx`, `…/consult/[visitId]/page.tsx`, `…/prescribe/[visitId]/page.tsx` | `getMockVisit` → `await getVisit`. |
| `…/queue/QueueClient.tsx`, `…/consult/[visitId]/ConsultClient.tsx` | Type import rename + `if (!client) return` guards. Consult send falls back to `POST {EDGE_AI_URL}/consult/ask` when no broker. |
| `…/prescribe/[visitId]/actions.ts` | Writes a real `prescriptions` row (id `rx_<8hex>`) after the CAS close. Throws on failure rather than reporting a success that leaves the patient nothing to collect. |
| `app/(patient)/(dashboard)/prescription/page.tsx` | Server-fetches the prescription — `?id=` targets one, otherwise the patient's latest. Was reading `getMockQueue()`. |
| `…/prescription/PrescriptionFulfillmentClient.tsx` | Hardcoded 3-pharmacy array replaced with `GET /api/pharmacies/nearby`; "Send eRx Here" calls `POST /api/pharmacies/route`. Added loading / empty / error / in-flight states. Same markup and classes. |
| `app/(patient)/(dashboard)/history/page.tsx` | Hardcoded `mockHistory` array replaced with real visits + reports + prescriptions. Urgency drives the badge colour; "Report" links to `/prescription?id=`. Same table markup. |
| `app/(patient)/(dashboard)/intake/page.tsx`, `VitalsForm.tsx` | Passes `patientId` through (see §4.2). No visual change. |
| `lib/mqtt.ts` | `getMqttClient()` returns `null` instead of throwing when `NEXT_PUBLIC_MQTT_URL` is unset — it was taking the whole doctor queue down. Also treats a `your-cluster` placeholder as unset. |
| `app/api/specialist/route.ts` | Replaced the unresolvable dynamic `import("../../../../lib/db")` with a static import + null check. This was the `tsc --noEmit` error T4 flagged. |

### 4.4 New file — `apps/web/.env.example`

The web app had none. Documents every var, including three new names nobody has set:
`NEXT_PUBLIC_MQTT_URL`, `NEXT_PUBLIC_MQTT_USERNAME`, `NEXT_PUBLIC_MQTT_PASSWORD`.

---

## 5 · T4 · `db/` and analytics

| File | Change |
|---|---|
| `db/edge_schema.sql` | New `branching_rules` table + `insert or ignore` seed of the same 7 rules as `002_seed.sql`. They live on the edge because the engine must fire with the wifi out. `question_branch_tags` is a comma-separated string — SQLite has no array type. |
| `app/(analytics)/analytics/page.tsx` | Null guard on `db` with an explanatory panel. Second of the two `tsc` errors. |

---

## 6 · What was verified live, and what was not

Ran against the live Supabase, then cleaned up every test row.

**Verified end to end:** edge service created a visit → outbox drained to Supabase →
appeared in the doctor's queue tagged Urgent → claimed (real CAS) → prescription
written → routed to Devi Pharmacy → dispensed and marked fulfilled. Plus: rules fire
`urgent / 2 flags` on SpO2 91 + temp 38.9 and do not double-count on re-entry; the
nurse-finding reminds once then records `not_obtained`; translation returns real
Malayalam and Tamil; `tsc --noEmit` clean; `npm run build` clean.

**NOT verified — do not claim these:**

- **STT with real audio.** `/voice/turn` has never been exercised with a recording.
  It is the only leg of the pipeline still unproven.
- **The MQTT broker path.** `MQTT_URL` is still the `your-cluster` placeholder. The
  relay code is written and the HTTP fallback works on one laptop; two laptops needs
  a real HiveMQ cluster.
- **Fully-offline operation.** LM Studio is not running, so every LLM call falls
  through to Groq, which needs the internet. Affects demo steps 1 and 6 — the
  *urgency* half of the report is fully local, but the narrative summary is not.
  This is why step 6 is not claimed on the board.
- **The Specialist AI panel.** Route typechecks and imports cleanly; the button was
  never clicked.

---

## 7 · Known-stale after this pass

- `agents/status/T2.md`, `T3.md`, `T4.md` do not mention any of the above. Each lane
  owns its own file; T1 did not edit them. This log is the substitute until they do.
- Nothing here is committed. All 35 files are working-tree only.
