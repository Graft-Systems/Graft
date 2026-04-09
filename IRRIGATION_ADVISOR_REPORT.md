# Irrigation Advisor Report

## Overview

The `Irrigation Advisor` was added as a separate product area in Graft, fully outside `VIGIL`, with its own backend APIs, recommendation engine, producer dashboard route, and sidebar navigation. It reuses shared vineyard, block, weather, and irrigation data, but its recommendation logic and UI are isolated from the `VIGIL` workflow.

## What Was Added

- A neutral shared agriculture data layer for vineyards, blocks, weather, and irrigation logs
- New irrigation-specific models for:
  - soil moisture readings
  - block moisture targets
  - irrigation recommendations
- New APIs for:
  - soil moisture list/create
  - CSV soil moisture upload
  - block moisture target settings
  - recommendation generation and retrieval
  - irrigation summary data
- A dedicated dashboard at `/ProducerDashboard/irrigation`
- A rules-based irrigation engine that uses soil moisture trend, irrigation history, and forecast weather to produce `72h` and `7d` recommendations
- JWT refresh handling in the frontend API client so recommendation generation keeps working when the short-lived access token expires

## What Was Validated

- The dashboard route loads successfully
- The seeded producer demo account works
- Recommendation cards render correctly
- Recommendation generation works end-to-end through the backend
- Backend tests passed for recommendation logic, API scoping, CSV import handling, and shared-data compatibility

## Current Seeded Demo Data

- Producer account: `irrigation_demo`
- Producer password: `demo1234`
- Vineyard: `North Estate`
- Block: `Block A`
- Moisture targets: `22.0 / 28.0 / 18.0`
- Seeded soil moisture readings show a drying trend ending at `17.6%`
- Seeded recommendations currently return `increase` for both `72h` and `7d`

## Remaining Manual QA Still Needed

### Manual Soil Moisture Entry

Still needs to be tested in the browser:

- Add a new manual soil moisture reading in the dashboard
- Confirm it appears at the top of the readings list
- Click `Generate` again
- Confirm the recommendation updates appropriately

Suggested test entry:

- `recorded_at`: current date/time
- `moisture_pct`: `15.8`
- `notes`: `manual dry check`

Expected outcome:

- The new reading should appear at the top of the list
- The recommendation will likely remain `increase`
- Recommended gallons may increase slightly because the newest reading is drier than the seeded `17.6%`

### CSV Upload

Still needs to be tested in the browser:

- Upload a CSV file through the dashboard
- Confirm the uploaded rows appear in the readings list
- Click `Generate` again
- Confirm recommendations can still be regenerated successfully

Suggested CSV file:

```csv
recorded_at,moisture_pct,source_label,notes
2026-03-19T08:00:00,21.4,probe-b,morning pass
2026-03-19T14:00:00,19.9,probe-b,afternoon pass
```

If you want the uploaded rows to appear closer to the top of the list during testing, use later timestamps such as:

```csv
recorded_at,moisture_pct,source_label,notes
2026-03-19T21:00:00,21.4,probe-b,morning pass
2026-03-19T22:00:00,19.9,probe-b,afternoon pass
```

Expected outcome:

- Both rows should appear in the readings list
- The dashboard should still allow recommendation regeneration
- If the newest uploaded reading is wetter than `15.8`, the gallons recommendation may decrease slightly

## Recommended Next QA Step

Run one manual-entry test and one CSV-upload test in the browser, then compare whether the recommendation action, gallons, or explanation changed as expected.
