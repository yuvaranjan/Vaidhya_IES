# T3 — Prescription delivery + pharmacy

**You own:** the patient-side prescription view, the nearby-pharmacy list, and the
routing into `pharmacy_queue`. In files: `apps/web/app/(patient)/prescription/`,
the pharmacy API routes, and the `pharmacies` / `stock_items` / `pharmacy_queue` tables.

**Coordinate with T2** before adding files under `apps/web/` — agree on which
directories are yours so you never edit the same file. Suggested split: T2 owns
`app/(doctor)/**`, you own `app/(patient)/prescription/**`, `app/(pharmacy)/**` and
`app/api/pharmacies/**`.

## Context pack — read these, in this order

Run `/t3` and this happens for you. Doing it by hand:

| Order | File | Why |
|---|---|---|
| 1 | `agents/status/T3.md` | where you left off — always first |
| 2 | this file | scope, boundaries, build order |
| 3 | `db/001_schema.sql` (`pharmacies`, `stock_items`, `prescriptions`, `pharmacy_queue`, `bills`) | the tables you own |
| 4 | `db/002_seed.sql` | the data you are building against, including the deliberate stock gap |
| 5 | `apps/web/app/globals.css` (top comment) | the frozen theme rules |
| 6 | `Docs/Project_Vaidhya_Technical_Architecture_v1.md` §11 and §11.1 | the how — read both, they are short |
| 7 | `PROGRESS.md` | what the other lanes changed while you were away |

## Build order → architecture section → files

From the V1 build plan §6 (~6h). **Arch §** is the section of
`Docs/Project_Vaidhya_Technical_Architecture_v1.md` that tells you how to build it.

| # | Task | Est | Arch § | Files | Status |
|---|---|---|---|---|---|
| 1 | Seed pharmacies + stock | 1h | §3.2 | `db/002_seed.sql` | ✅ done |
| 2 | `GET /api/pharmacies/nearby` + haversine | 1h | **§11** | `app/api/pharmacies/nearby/route.ts` | todo |
| 3 | Patient prescription view + print/download | 1.5h | **§11.1** | `app/(patient)/prescription/` | todo |
| 4 | Nearby list, per-medicine status, selection | 1.5h | **§11** | `app/(patient)/prescription/` | todo |
| 5 | Routing → `pharmacy_queue` insert | 1h | **§11**, §3.2 | `app/api/pharmacies/route.ts` | todo |
| p2 | Pharmacist portal: stock CRUD, queue, billing | — | **§11** | `app/(pharmacy)/` | phase 2 |

Config keys: `NEARBY_RADIUS_KM` in `apps/web/.env.local.example`.
Database write ownership — which tables you may write: build plan §2.5.

## Rules that are not negotiable

- **The patient portal *is* the delivery channel.** Nothing about the prescription
  depends on SMS. If a judge asks how the patient gets it: they open it, they print it.
  SMS is a *reminder about* the prescription, and it is phase 2.
- **One pharmacy is deliberately out of stock** on a prescribed medicine
  (Amala Medicals, Paracetamol 500mg). That gap is the entire point of the "which
  pharmacy actually has all of it" screen. Do not quietly fix the data.
- `stock_items.status` is a **generated column** — derived from quantity in the DB.
  Never write it by hand; that is where stale-status bugs come from.

## Definition of done

Doctor issues a prescription → patient sees it, downloads it, sees which nearby
pharmacy has all the medicines, selects one, and it lands in that pharmacy's queue.

## Demo steps you own

10, 11.

## After V1

The full pharmacist portal: stock CRUD, incoming queue, billing.
