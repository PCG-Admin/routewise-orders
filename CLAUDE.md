# CLAUDE.md — Truck Allocations / Bulk Connections TMS

This file gives Claude (and any developer) a complete picture of this project so no time is wasted re-exploring the codebase on every session.

---

## What This Application Is

A **Transport Management System (TMS)** for **Bulk Connections / PC Group**, a South African bulk logistics company. The system manages truck allocation orders — primarily chrome ore transported from mines (Northam Eland, Farm Zondereinde, etc.) to ports (Richards Bay, Durban).

The core feature is **automated data ingestion**: users upload Newton Weighbridge Detail Report (WDR) PDFs or Excel truck allocation sheets, and the system uses AI (Gemini) to extract structured data (order number, truck registrations, weights, dates) and save it directly to the database.

---

## Architecture Overview

```
Browser (Next.js 14 / Vercel)
    │
    │  REST API calls
    ▼
FastAPI Backend (Python / Render.com Docker)
    │
    ├── Supabase PostgreSQL (database)
    └── Google Gemini 2.5 Flash (AI extraction)
```

**Frontend URL:** deployed on Vercel (`bulk-01.vercel.app` and preview URLs)
**Backend URL:** `https://bulk-01-1-docker.onrender.com` (Docker container on Render)
**Database:** Supabase project `fmdtacmflsiiejuaarxt`

---

## Project Structure

```
truck-allocations/
├── CLAUDE.md                       ← you are here
├── .env.local                      ← frontend env vars (Supabase + API URL)
├── next.config.mjs                 ← CSP headers (must add new domains here)
├── package.json
├── src/
│   ├── lib/
│   │   └── api.ts                  ← ALL frontend→backend API calls live here
│   └── app/
│       ├── page.tsx                ← Login page
│       ├── layout.tsx              ← Root layout (fonts, metadata)
│       └── dashboard/
│           ├── layout.tsx          ← Sidebar navigation (auth check)
│           ├── page.tsx            ← Main orders dashboard (largest file ~1436 lines)
│           └── reports/
│               ├── overview/page.tsx       ← KPIs, charts, live orders
│               ├── logistics/page.tsx      ← Transporter/truck tables
│               └── order-reports/page.tsx  ← Client & product analytics
└── backend/
    ├── main.py                     ← FastAPI app: all routes + Gemini + save logic
    ├── pdf_extractor.py            ← PDF text extraction (pdfplumber → PyPDF2 → OCR)
    ├── excel_extractor.py          ← Excel extraction (3 template engines)
    ├── utils.py                    ← safe_date(), safe_float() shared helpers
    ├── requirements.txt
    ├── Dockerfile
    └── .env                        ← backend secrets (Supabase + Gemini keys)
```

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14.2.35 | React framework, App Router |
| React | 18 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| Recharts | 3 | Charts (bar, pie) |
| Lucide React | latest | Icons |
| @supabase/supabase-js | 2 | Supabase client (configured but auth done via backend) |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3.11 | Runtime |
| pdfplumber | PDF text + table extraction (primary) |
| PyPDF2 | PDF fallback extractor |
| pdf2image + pytesseract | OCR for scanned PDFs |
| Pillow | Image processing for OCR |
| openpyxl | Excel file reading (structured templates) |
| pandas | Excel fallback (Gemini path) |
| google-genai | Gemini 2.5 Flash AI extraction |
| supabase-py | Database client |
| python-dotenv | Env var loading |

---

## Environment Variables

### Frontend — `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://fmdtacmflsiiejuaarxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_API_URL=https://bulk-01-1-docker.onrender.com
```

### Backend — `backend/.env`
```
SUPABASE_URL=https://fmdtacmflsiiejuaarxt.supabase.co
SUPABASE_KEY=<service role key>         ← service role, NOT anon
GEMINI_API_KEY=<gemini api key>         ← rotate this if extraction breaks
TESSERACT_CMD=/usr/bin/tesseract        ← set automatically in Docker
```

**Important:** The backend uses the Supabase **service role** key (bypasses RLS). The frontend uses the **anon** key.

---

## Database Schema (Supabase)

### `users` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| email | text | unique, lowercase |
| name | text | display name |
| role | text | "admin" or "user" |
| password | text | plain text (no hashing currently) |

### `orders` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| orderNumber | text | e.g. `ELD26-05-30`, `VRC26-05-001` |
| clientName | text | e.g. "NORTHAM ELAND" |
| product | text | e.g. "CHR001" (chrome ore) |
| quantity | float | total tonnage |
| unit | text | "tons" |
| status | text | pending / in_transit / completed / cancelled |
| priority | text | normal / high |
| originAddress | text | mine/site name |
| destinationAddress | text | port or city |
| requestedPickupDate | date | YYYY-MM-DD |
| requestedDeliveryDate | date | |
| notes | text | e.g. "Imported from filename.pdf" |
| createdAt | timestamptz | |
| updatedAt | timestamptz | |

### `truck_allocations` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| orderId | uuid | FK → orders.id |
| vehicleReg | text | truck plate e.g. "LGZ388MP" — REQUIRED |
| driverName | text | |
| driverPhone | text | |
| transporter | text | transport company e.g. "VRC" |
| status | text | scheduled / in_transit / completed |
| scheduledDate | date | YYYY-MM-DD |
| ticketNo | text | weighbridge transaction number |
| grossWeight | float | in kg |
| tareWeight | float | in kg |
| netWeight | float | in kg |
| fleetNo | text | |
| trailer1 | text | first trailer plate |
| trailer2 | text | second trailer plate |
| driverId | text | SA ID number |

---

## API Endpoints (Backend)

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Validates email+password against `users` table, returns `{id, email, name, role}` |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/` | Returns `{message, status}` |
| GET | `/api/health` | Returns `{status, timestamp}` |

### Orders CRUD
| Method | Path | Description |
|---|---|---|
| GET | `/api/orders` | All orders, ordered by `createdAt` DESC |
| GET | `/api/orders/{id}` | Single order |
| POST | `/api/orders` | Create order manually |
| PUT | `/api/orders/{id}` | Update order |
| DELETE | `/api/orders/{id}` | Delete order + its trucks |

### Truck Allocations CRUD
| Method | Path | Description |
|---|---|---|
| GET | `/api/orders/{id}/trucks` | All trucks for an order |
| POST | `/api/orders/{id}/trucks` | Add truck to order |
| PUT | `/api/orders/{id}/trucks/{truck_id}` | Update truck |
| DELETE | `/api/orders/{id}/trucks/{truck_id}` | Delete truck |
| GET | `/api/trucks` | All trucks across all orders (limit 500) |

### File Upload (AI extraction)
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload/pdf` | Upload WDR PDF → pdfplumber/OCR → Gemini → Supabase |
| POST | `/api/upload/excel` | Upload Excel → template engine → Gemini fallback → Supabase |

### Reports & Templates
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Aggregated stats for all report pages |
| GET | `/api/template/excel` | Download blank truck allocation Excel template |
| GET | `/api/report/excel/{order_id}` | Download filled KFTS-style Excel report for an order |

---

## PDF Extraction Pipeline

**File:** `backend/pdf_extractor.py`

The main function is `extract_pdf_text(file_bytes) -> str`, called by the upload route in `main.py`.

```
Stage 1: pdfplumber (primary)
   - Extracts prose text AND tables (formatted as pipe-delimited rows)
   - Best for Newton WDR reports — preserves column alignment
   - If result >= 200 chars → use it

Stage 2: PyPDF2 (secondary fallback)
   - Faster, less accurate for tables
   - If result >= 200 chars → use it

Stage 3: Tesseract OCR (scanned PDF fallback)
   - pdf2image converts pages to 300 DPI greyscale images
   - pytesseract reads each image
   - Used when stages 1+2 both return < 200 chars
   - Tesseract binary: /usr/bin/tesseract (Docker) or Windows path fallback

→ Text passed to Gemini 2.5 Flash (max 30,000 chars)
→ Gemini returns structured JSON
→ save_extracted_to_db() writes to Supabase
```

**WDR PDF format** (Newton weighbridge system):
- Header: report title, mine name, filter date range
- Table columns: DATE, TRAN NO, MINE TRANS, USER, ORDERNO, TRAN TYPE, TARE, GROSS, NETT, PRODUCT, TRUCK REG, TRANSPORTER, SUPPLIER, DEST
- Summary box at bottom: ORDER NUMBER, ORDER QTY, TOTAL NET, ORDER REMAINING
- Each DISP row = one truck dispatch

---

## Excel Extraction Pipeline

**File:** `backend/excel_extractor.py`

The main function is `extract_excel_structured(file_bytes) -> dict | None`.

Three template engines tried in priority order:

| Template | Detection | Structure |
|---|---|---|
| KFTS / Island View | Row 3 has HORSE REG column | Row 1: job ref + "LOADED DD-MM-YYYY", Row 3: headers, Row 4+: truck data |
| Bulk Connections standard | Row 1 contains "BULK CONNECTIONS" | Rows 3-9: label/value order info, Row 11: headers, Row 12+: truck data |
| Generic auto-detect | Scans first 15 rows for vehicle reg column | Reads data rows below header, stops after 3 empty rows |

If no template matches → `excel_to_text()` converts entire sheet to pipe-delimited text → Gemini AI extracts data (same as PDF path).

**Download template:** `GET /api/template/excel` generates a styled Bulk Connections template that all three engines can read.

---

## Gemini AI Extraction

**Prompt location:** `GEMINI_PROMPT` constant in `backend/main.py` (~line 359)

Key rules encoded in the prompt:
- `orderNumber` comes from the summary box at the bottom of WDR, NOT from the ORDERNO column
- `clientName` comes from the report title header (e.g. "NORTHAM ELAND")
- `pickupDate` comes from the "Filter Range" start date
- `USER` column = weighbridge operator, NOT the driver → `driverName` is null for WDR
- Weight values are plain integers in kg
- All DISP rows = one truck each, status = "completed"
- Returns raw JSON only (no markdown fences)

**Model:** `gemini-2.5-flash`
**Client:** `google.genai` SDK (`from google import genai`)

---

## Frontend Pages

### Login (`src/app/page.tsx`)
- Simple email/password form
- Calls `POST /api/auth/login` via `loginUser()` in `api.ts`
- Stores `{id, email, name, role}` in `localStorage` as `user` key
- Redirects to `/dashboard`

### Dashboard Layout (`src/app/dashboard/layout.tsx`)
- Reads `user` from localStorage on mount; redirects to `/` if missing
- Collapsible sidebar with navigation links
- Reports section is an expandable submenu

### Main Dashboard (`src/app/dashboard/page.tsx`)
The largest file. Manages all order and truck interactions:
- Fetches orders from `GET /api/orders`
- Filter bar: order number, product, client, status, date range
- Stats bar: total / pending / in_transit / completed / cancelled counts
- Per-order: expand to see trucks, manage allocations, upload files
- Modals: New Order, Manual Entry, File Upload, Edit Order, Manage Trucks, Add Truck
- Upload modal calls `uploadExcel()` or `uploadPDF()` from `api.ts`

### Reports
- **Overview** (`/dashboard/reports/overview`) — KPI cards, bar/pie charts, live order tracking, analytics tab
- **Logistics** (`/dashboard/reports/logistics`) — transporter breakdown, all-trucks table, status chart
- **Order Reports** (`/dashboard/reports/order-reports`) — client/product analytics, league table

All report pages call `GET /api/stats` for data.

---

## Frontend → Backend API (`src/lib/api.ts`)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bulk-01-1-docker.onrender.com';

loginUser(email, password)       → POST /api/auth/login
uploadExcel(file, token)         → POST /api/upload/excel  (multipart/form-data)
uploadPDF(file, token)           → POST /api/upload/pdf    (multipart/form-data)
fetchOrders(token)               → GET  /api/orders
createOrder(orderData, token)    → POST /api/orders
```

Note: `token` is not currently validated by the backend (no JWT middleware). It is passed but the backend reads the Supabase `users` table directly.

---

## Content Security Policy

Configured in `next.config.mjs`. The `connect-src` directive controls which domains the browser will allow fetch() calls to. **If you add a new external API call from the frontend, you must add its domain here** or the browser will block it.

Current `connect-src`: `'self' https://bulk-01-1-docker.onrender.com`

---

## CORS (Backend)

Configured in `main.py` via `CORSMiddleware`. Allowed origins:
- `http://localhost:3000`, `3001`, `3002`
- `https://bulk-01.vercel.app`
- Specific Vercel preview URLs

**If a new Vercel deployment URL appears, add it to the CORS list in `main.py` and redeploy the backend.**

---

## Running Locally

### Frontend
```bash
cd truck-allocations
npm install
npm run dev        # runs on http://localhost:3000
```

### Backend
```bash
cd truck-allocations/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend also needs Tesseract OCR installed for scanned PDF support:
- Windows: download installer from https://github.com/UB-Mannheim/tesseract/wiki
- Set `TESSERACT_CMD` env var to the `.exe` path, or it auto-detects standard install paths

---

## Deployment

### Backend (Render.com)
- Service type: **Web Service** using **Docker**
- Dockerfile: `backend/Dockerfile`
- The Dockerfile installs `tesseract-ocr`, `tesseract-ocr-eng`, `poppler-utils` as system packages
- Env vars are set in the Render dashboard (not committed)
- Any change to `backend/` requires a redeploy on Render
- `render.yaml` may exist at root for IaC deployment config

### Frontend (Vercel)
- Connected to Git repo, auto-deploys on push to main
- Env vars set in Vercel dashboard
- Build command: `next build --no-lint`

---

## Known Patterns & Gotchas

1. **Passwords are plain text** — no hashing. The `users` table stores passwords as-is. Do not implement bcrypt without also migrating existing rows.

2. **No JWT / session tokens** — the `token` parameter in `api.ts` functions is passed but the backend doesn't validate it. Auth is just a lookup against the `users` table.

3. **Duplicate order protection** — `save_extracted_to_db()` checks if `orderNumber` already exists before inserting. If it exists, trucks are appended to the existing order (not duplicated).

4. **`vehicleReg` is the only required truck field** — rows missing it are skipped and counted in `trucks_skipped`.

5. **Gemini API key rotation** — if uploads start returning "Import failed", the Gemini API key has likely expired. Update `GEMINI_API_KEY` in `backend/.env` and redeploy.

6. **pdfplumber is primary** — PyPDF2 was the original extractor but produced scrambled table text for WDR PDFs. pdfplumber extracts tables as aligned rows. Do not remove PyPDF2 — it is the secondary fallback.

7. **Excel template download** — `GET /api/template/excel` generates a Bulk Connections branded template. The KFTS template is a separate format (external party uploads).

8. **`safe_date()` in `utils.py`** — handles DD-MM-YYYY, DD/MM/YYYY, and YYYY-MM-DD. WDR dates come as `2026-05-13 17:48:16` (datetime strings) — the function strips the time portion.

9. **Stats endpoint** — `GET /api/stats` fetches ALL orders and ALL trucks in two queries. If the database grows very large this will slow down the reports page. Consider pagination or aggregation views in Supabase at that point.

10. **CSP + new API domains** — adding any `fetch()` call to a new external domain in the frontend requires updating `connect-src` in `next.config.mjs` AND redeploying the frontend, otherwise the browser silently blocks it with a CSP error.
