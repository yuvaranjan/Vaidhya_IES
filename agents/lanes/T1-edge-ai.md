# T1 — AI lane (Yuvaranjan)

**You own:** `services/edge-ai/` — all of it — plus exactly one TypeScript file,
`apps/web/app/api/specialist/route.ts`.

**You never open:** anything else under `apps/web/`. Not to peek, not to fix a typo.
If something there is wrong, say so in your status file and let T2 fix it.

**You run:** `uvicorn main:app --reload --port 8000`. You test with `requests.http`
and curl. **You never open a browser** — if you find yourself debugging in a browser,
you are in T2's lane.

## Context pack — read these, in this order

Run `/t1` and this happens for you. Doing it by hand:

| Order | File | Why |
|---|---|---|
| 1 | `agents/status/T1.md` | where you left off — always first |
| 2 | this file | scope, boundaries, build order |
| 3 | `services/edge-ai/contracts.py` | the frozen HTTP + MQTT contract you must satisfy |
| 4 | `Docs/Project_Vaidhya_Technical_Architecture_v1.md` §§ for your task (table below) | the how |
| 5 | `Docs/Project_Vaidhya_V1_Build_Plan.md` §4 | estimates and the definition of done |
| 6 | `PROGRESS.md` | what the other lanes changed while you were away |

Never read the whole architecture document. Read the sections your current task maps to.

## Build order → architecture section → files

From the V1 build plan §4. **Arch §** is the section of
`Docs/Project_Vaidhya_Technical_Architecture_v1.md` that tells you how to build it.

| # | Task | Est | Arch § | Files | Status |
|---|---|---|---|---|---|
| 1 | FastAPI scaffold, CORS, `/health` | 0.5h | §1, §2 | `main.py` | ✅ done |
| 2 | `LLMProvider` → LM Studio + Groq fallback | 1h | **§4**, §5.3 | `providers/llm.py` | todo |
| 3 | `STTProvider` → Groq Whisper turbo | 1h | **§4** | `providers/stt.py` | todo |
| 4 | `TTSProvider` → edge-tts, serve `/audio/*.mp3` | 1h | **§4**, §5.3 | `providers/tts.py` | todo |
| 5 | `TranslateProvider` → cache then model | 1.5h | **§4**, §3.2 (`question_bank`) | `providers/translate.py` | todo |
| 6 | Session store | 1h | §3.3 | `voicebot/session.py` | ✅ scaffolded |
| 7 | **Voicebot turn loop** + JSON schema + retry | 2.5h | **§5.1, §5.2** | `voicebot/orchestrator.py`, `prompts.py` | todo — the core |
| 8 | **Nurse-finding state machine** | 1.5h | **§5.4** | `voicebot/session.py` | ✅ scaffolded |
| 9 | Rules engine + urgency tiering | 1h | **§6** | `rules/engine.py` | ✅ parser done |
| 10 | Report builder + Supabase write | 1h | **§7**, §3.2 | `report/builder.py` | todo |
| 11 | MQTT client — queue publish + consult relay | 1.5h | **§8.1–8.4** | `mqtt_client.py` | todo |
| + | Specialist AI slice | 1h | **§10** | `apps/web/app/api/specialist/route.ts` | todo |
| p2 | Offline SQLite + outbox sync | — | **§3.3** | `sync/outbox.py` | phase 2 — demo step 7 |

Config keys for all of the above: §15 (Node A block) and `services/edge-ai/.env.example`.

## Rules that are not negotiable

- **No `asyncio` timers, no background tasks.** Pending-finding state is computed from
  timestamps on every read. It cannot race, it survives a restart, it cannot hang.
- **JSON parse failure retries once, then falls back to a fixed safe question.** A
  crashed turn loses the session; a slightly worse question does not.
- **Every response carries the English text**, always. T2 puts it on screen. That is
  the entire mitigation for an LLM-authored, machine-translated clinical question that
  no human proofread.
- On `/intake/complete` do **both**: write to Supabase *and* publish to
  `vaidhya/queue/new` retained. The DB is the durable record; MQTT makes it live.

## Definition of done

`curl` a Malayalam audio file to `/voice/turn` and get back Malayalam bot audio plus an
English transcript. `/intake/complete` writes a report to Supabase and publishes to
`vaidhya/queue/new`.

## Demo steps you own

1, 3, 4, 5, 6, 7, 8 — including all three of the ones that actually win it.

## Contract changes

`services/edge-ai/contracts.py` mirrors `packages/shared/http.ts` and `mqtt.ts`. If you
change one, change all three in the same five minutes, tell T2 out loud, and write it
under **Notes for other lanes** in `agents/status/T1.md`.
