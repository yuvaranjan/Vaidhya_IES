# T2 — Portal lane (Yadav)

**You own:** `apps/web/` — all of it except `app/api/specialist/route.ts`, which is T1's.

**You never open:** `services/edge-ai/`. If the service misbehaves, check `/health`,
then tell T1. You do not fix Python.

**You run:** `npm run dev` on `:3000`. With `NEXT_PUBLIC_USE_MOCK_AI=true` you need
nothing else — no Python, no model, no GPU.

## Build order (from the V1 build plan §5)

| # | Task | Est | Note |
|---|---|---|---|
| 1 | Next.js scaffold, theme tokens, layout shell | 1h | ✅ done |
| 2 | `lib/mockAi.ts` | 0.5h | ✅ done — unblocks everything below |
| 3 | Patient login (phone + OTP `123456`) | 1h | `iron-session` cookie |
| 4 | Doctor login (phone + password) | 1h | bcrypt against the seed |
| 5 | Vitals dashboard — 5 fields → POST → auto-navigate | 1.5h | temp, BP, pulse, SpO2, resp |
| 6 | **AI assistant page** — mic, playback, dual transcript | 2.5h | |
| 7 | Nurse-finding panel — from the 2s poll, inline | 1h | must not navigate away |
| 8 | Doctor queue — MQTT live + claim CAS + 409 toast | 2h | |
| 9 | Doctor consult — report view + MQTT chat | 2h | |
| 10 | Doctor prescription form | 1h | patient-side view is T3's |

## Rules that are not negotiable

- **The theme is frozen.** Tokens are at the top of `app/globals.css` with the rules in
  a comment. Light mode only, flat 2D, green for primary actions, amber and red only on
  urgency. Do not add a dark variant. Do not add a gradient.
- **Step 6's English text is always on screen** beside the native-language audio, and
  the transcript shows both languages. Fifteen minutes of work. Not optional — it is
  what makes the demo legible to a judge who does not speak Malayalam.
- **Everything goes through `lib/edgeApi.ts`.** No component calls
  `fetch("http://localhost:8000")` directly. That is what makes the hour-8 flag flip a
  one-line change instead of a grep across the app.
- **Claim is a compare-and-swap**, guarded on `status = 'awaiting_doctor'`. Zero rows
  back → 409 → toast and drop the row. No application locking.

## Definition of done

With `USE_MOCK_AI=true`, the full patient flow runs start to finish in the browser.
With it `false`, the same flow runs against T1's service and nothing else changes.

## Demo steps you own

2, 9. Step 9 needs T1's MQTT relay on the edge side — coordinate before you start it.

## Contract changes

`packages/shared/http.ts` and `mqtt.ts` are mirrored by
`services/edge-ai/contracts.py`. Changing one means changing all three together, with
T1 present. Then write it under **Notes for other lanes** in `agents/status/T2.md`.
