# T1 — AI lane (Yuvaranjan)

**You own:** `services/edge-ai/` — all of it — plus exactly one TypeScript file,
`apps/web/app/api/specialist/route.ts`.

**You never open:** anything else under `apps/web/`. Not to peek, not to fix a typo.
If something there is wrong, say so in your status file and let T2 fix it.

**You run:** `uvicorn main:app --reload --port 8000`. You test with `requests.http`
and curl. **You never open a browser** — if you find yourself debugging in a browser,
you are in T2's lane.

## Build order (from the V1 build plan §4)

| # | Task | Est | Note |
|---|---|---|---|
| 1 | FastAPI scaffold, CORS, `/health` | 0.5h | ✅ done — T2 needed the port live |
| 2 | `LLMProvider` → LM Studio + Groq fallback | 1h | fall back on `EDGE_LLM_TIMEOUT_MS` |
| 3 | `STTProvider` → Groq Whisper turbo | 1h | returns native + English |
| 4 | `TTSProvider` → edge-tts, serve `/audio/*.mp3` | 1h | |
| 5 | `TranslateProvider` → cache lookup then model | 1.5h | a cache miss is normal, not an error |
| 6 | Session store | 1h | ✅ scaffolded — dict + SQLite persist |
| 7 | **Voicebot turn loop** + JSON schema + retry | 2.5h | the core |
| 8 | **Nurse-finding state machine** | 1.5h | ✅ scaffolded — lazy, no timers |
| 9 | Rules engine + urgency tiering | 1h | ✅ scaffolded — condition parser done |
| 10 | Report builder + Supabase write | 1h | one LLM call for the summary |
| 11 | MQTT client — queue publish + consult relay | 1.5h | QoS 1, stable client_id |
| + | Specialist AI slice (`/api/specialist` + panel) | 1h | one general button, no picker |

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
