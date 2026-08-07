# T3 — Prescription delivery + pharmacy

**You own:** the patient-side prescription view, the nearby-pharmacy list, and the
routing into `pharmacy_queue`. In files: `apps/web/app/(patient)/prescription/`,
the pharmacy API routes, and the `pharmacies` / `stock_items` / `pharmacy_queue` tables.

**Coordinate with T2** before adding files under `apps/web/` — agree on which
directories are yours so you never edit the same file. Suggested split: T2 owns
`app/(doctor)/**`, you own `app/(patient)/prescription/**`, `app/(pharmacy)/**` and
`app/api/pharmacies/**`.

## Build order (from the V1 build plan §6, ~6h)

| # | Task | Est | Note |
|---|---|---|---|
| 1 | Seed pharmacies + stock | 1h | ✅ done in `db/002_seed.sql` |
| 2 | `GET /api/pharmacies/nearby` + haversine | 1h | `NEARBY_RADIUS_KM` |
| 3 | Patient prescription view + print/download | 1.5h | |
| 4 | Nearby list with per-medicine status + selection | 1.5h | in stock / low / out of stock |
| 5 | Routing → `pharmacy_queue` insert | 1h | unique constraint on prescription_id |

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
