# T2 — Portal lane (Yadav)

**You own:** `apps/web/` — all of it except `app/api/specialist/route.ts`, which is T1's.

**You never open:** `services/edge-ai/`. If the service misbehaves, check `/health`,
then tell T1. You do not fix Python.

**You run:** `npm run dev` on `:3000`. With `NEXT_PUBLIC_USE_MOCK_AI=true` you need
nothing else — no Python, no model, no GPU.

## Context pack — read these, in this order

Run `/t2` and this happens for you. Doing it by hand:

| Order | File | Why |
|---|---|---|
| 1 | `agents/status/T2.md` | where you left off — always first |
| 2 | this file | scope, boundaries, build order |
| 3 | `packages/shared/http.ts` + `mqtt.ts` | the frozen contract — the shapes you code against |
| 4 | `apps/web/lib/edgeApi.ts` + `lib/mockAi.ts` | how you call the service, and what the mock returns |
| 5 | `apps/web/app/globals.css` (top comment) | the frozen theme rules |
| 6 | `Docs/Project_Vaidhya_Technical_Architecture_v1.md` §§ for your task (table below) | the how |
| 7 | `PROGRESS.md` | what the other lanes changed while you were away |

Never read the whole architecture document. Read the sections your current task maps to.

## Build order → architecture section → files

From the V1 build plan §5. **Arch §** is the section of
`Docs/Project_Vaidhya_Technical_Architecture_v1.md` that tells you how to build it.

| # | Task | Est | Arch § | Files | Status |
|---|---|---|---|---|---|
| 1 | Scaffold, theme tokens, layout shell | 1h | §2 | `app/layout.tsx`, `globals.css` | ✅ done |
| 2 | `lib/mockAi.ts` | 0.5h | build plan §2.3–2.4 | `lib/mockAi.ts` | ✅ done |
| 3 | Patient login (phone + OTP `123456`) | 1h | **§14** | `app/(patient)/login/`, `lib/auth.ts` | todo |
| 4 | Doctor login (phone + password) | 1h | **§14** | `app/(doctor)/doctor/login/` | todo |
| 5 | Vitals dashboard — 5 fields → auto-navigate | 1.5h | §5.4 (two-pass), §6 | `app/(patient)/intake/` | todo |
| 6 | **AI assistant page** — mic, playback, dual transcript | 2.5h | **§5.1**, §5.3 | `app/(patient)/consult/` | todo — biggest screen |
| 7 | Nurse-finding panel, inline from the 2s poll | 1h | **§5.4** | `app/(patient)/consult/` | todo |
| 8 | Doctor queue — MQTT live + claim CAS + 409 | 2h | **§9**, §8.1–8.3 | `app/(doctor)/doctor/queue/`, `lib/mqtt.ts` | todo |
| 9 | Doctor consult — report view + MQTT chat | 2h | **§8.1–8.4**, §7 | `app/(doctor)/doctor/consult/[visitId]/` | todo |
| 10 | Doctor prescription form | 1h | §11.1, §3.2 | `app/(doctor)/doctor/prescribe/[visitId]/` | todo |

Config keys: §15 (Node B block) and `apps/web/.env.local.example`.
Database write ownership — which tables you may write: build plan §2.5.

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
