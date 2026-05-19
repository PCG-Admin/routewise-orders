from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import pandas as pd
import io
import PyPDF2
import json
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Bulk Connections API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://bulk-01.vercel.app",
        "https://bulk-01-git-main-alisonrajpals-projects.vercel.app",
        "https://bulk-01-etlzmubpx-alisonrajpals-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase connected!")
except Exception as e:
    print(f"Supabase error: {e}")
    supabase = None

# Gemini client (new google.genai SDK)
gemini_client = None
if GEMINI_API_KEY:
    try:
        from google import genai as _genai  # type: ignore[import]
        gemini_client = _genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini initialized!")
    except Exception as e:
        print(f"Gemini error: {e}")

# ============================================
# ROOT & HEALTH
# ============================================

@app.get("/")
async def root():
    return {"message": "API is running", "status": "healthy"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ============================================
# AUTHENTICATION
# ============================================

@app.post("/api/auth/login")
async def login(credentials: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")

    email = (credentials.get("email") or "").strip().lower()
    password = credentials.get("password") or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    try:
        result = supabase.table("users").select("id,email,name,role,password").eq("email", email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = result.data[0]
        if user.get("password") != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name") or "",
            "role": user.get("role") or "user",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# ============================================
# ORDERS CRUD
# ============================================

@app.get("/api/orders")
async def get_orders():
    if not supabase:
        return {"orders": [], "error": "Supabase not connected"}
    try:
        result = supabase.table("orders").select("*").order("createdAt", desc=True).execute()
        return {"orders": result.data}
    except Exception as e:
        return {"orders": [], "error": str(e)}

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        result = supabase.table("orders").select("*").eq("id", order_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders")
async def create_order(order_data: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        new_order = {
            "id": str(uuid.uuid4()),
            "orderNumber": order_data.get("orderNumber", f"ORD-{int(datetime.now().timestamp())}"),
            "clientName": order_data.get("clientName", ""),
            "product": order_data.get("product", ""),
            "quantity": float(order_data.get("quantity", 0)) if order_data.get("quantity") else 0,
            "unit": order_data.get("unit", "kg"),
            "status": order_data.get("status", "pending"),
            "priority": order_data.get("priority", "normal"),
            "originAddress": order_data.get("originAddress", ""),
            "destinationAddress": order_data.get("destinationAddress", ""),
            "notes": order_data.get("notes", ""),
            "requestedPickupDate": order_data.get("requestedPickupDate"),
            "requestedDeliveryDate": order_data.get("requestedDeliveryDate"),
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }
        new_order = {k: v for k, v in new_order.items() if v is not None}
        result = supabase.table("orders").insert(new_order).execute()
        return {"message": "Order created successfully", "order": result.data[0] if result.data else new_order}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/orders/{order_id}")
async def update_order(order_id: str, order_data: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        update_data = {k: v for k, v in order_data.items() if v is not None}
        result = supabase.table("orders").update(update_data).eq("id", order_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Order updated successfully", "order": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        supabase.table("truck_allocations").delete().eq("orderId", order_id).execute()
        result = supabase.table("orders").delete().eq("id", order_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Order deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TRUCK ALLOCATIONS CRUD
# ============================================

@app.get("/api/orders/{order_id}/trucks")
async def get_order_trucks(order_id: str):
    if not supabase:
        return {"trucks": []}
    try:
        result = supabase.table("truck_allocations").select("*").eq("orderId", order_id).execute()
        trucks = []
        for item in result.data:
            trucks.append({
                "id": item.get("id"),
                "plate": item.get("vehicleReg", ""),
                "status": item.get("status", "scheduled"),
                "driver": item.get("driverName", ""),
                "phone": item.get("driverPhone", ""),
                "transporter": item.get("transporter", ""),
                "scheduledDate": item.get("scheduledDate", ""),
                "ticketNo": item.get("ticketNo", ""),
                "netWeight": item.get("netWeight", 0),
                "grossWeight": item.get("grossWeight", 0),
                "tareWeight": item.get("tareWeight", 0),
                "fleetNo": item.get("fleetNo", ""),
                "trailer1": item.get("trailer1", ""),
                "trailer2": item.get("trailer2", ""),
            })
        return {"trucks": trucks}
    except Exception as e:
        logger.error(f"Error fetching trucks: {e}")
        return {"trucks": []}

@app.post("/api/orders/{order_id}/trucks")
async def add_truck_to_order(order_id: str, truck_data: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        new_truck = {
            "id": str(uuid.uuid4()),
            "orderId": order_id,
            "vehicleReg": truck_data.get("plate", ""),
            "driverName": truck_data.get("driver", ""),
            "driverPhone": truck_data.get("phone", ""),
            "transporter": truck_data.get("transporter", ""),
            "status": truck_data.get("status", "scheduled"),
            "scheduledDate": truck_data.get("scheduledDate"),
            "ticketNo": truck_data.get("ticketNo", ""),
            "netWeight": float(truck_data.get("netWeight", 0)) if truck_data.get("netWeight") else None,
        }
        new_truck = {k: v for k, v in new_truck.items() if v is not None and v != ""}
        result = supabase.table("truck_allocations").insert(new_truck).execute()
        return {"message": "Truck added successfully", "truck": result.data[0] if result.data else new_truck}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/orders/{order_id}/trucks/{truck_id}")
async def update_truck_allocation(order_id: str, truck_id: str, truck_data: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        update_data = {k: v for k, v in truck_data.items() if v is not None}
        supabase.table("truck_allocations").update(update_data).eq("id", truck_id).eq("orderId", order_id).execute()
        return {"message": "Truck updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orders/{order_id}/trucks/{truck_id}")
async def delete_truck_allocation(order_id: str, truck_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        supabase.table("truck_allocations").delete().eq("id", truck_id).eq("orderId", order_id).execute()
        return {"message": "Truck deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# SHARED HELPERS
# ============================================

def safe_date(value) -> str | None:
    """Return YYYY-MM-DD string or None. Accepts datetime strings, date objects, etc."""
    if not value:
        return None
    s = str(value).strip()
    # Already YYYY-MM-DD
    m = re.match(r'^(\d{4}-\d{2}-\d{2})', s)
    if m:
        return m.group(1)
    # DD/MM/YYYY or DD-MM-YYYY
    m = re.match(r'^(\d{2})[/-](\d{2})[/-](\d{4})', s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None

def safe_float(value) -> float | None:
    try:
        return float(value) if value not in (None, "", "null") else None
    except (ValueError, TypeError):
        return None

def save_extracted_to_db(extracted: dict, filename: str) -> dict:
    """Save Gemini-extracted order + trucks to Supabase. Returns summary."""
    order_number = (extracted.get("orderNumber") or "").strip() or f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    trucks_list = extracted.get("trucks", [])

    # Check if order already exists
    existing = supabase.table("orders").select("id,orderNumber").eq("orderNumber", order_number).execute()
    if existing.data:
        order = existing.data[0]
        logger.info(f"Order already exists: {order_number}")
    else:
        new_order = {
            "id": str(uuid.uuid4()),
            "orderNumber": order_number,
            "clientName": extracted.get("clientName") or "Unknown Client",
            "product": extracted.get("product") or "Unknown",
            "quantity": safe_float(extracted.get("orderQty")) or float(len(trucks_list)),
            "unit": extracted.get("unit") or "tons",
            "status": "pending",
            "priority": "normal",
            "originAddress": extracted.get("originAddress") or "",
            "destinationAddress": extracted.get("destinationAddress") or "",
            "requestedPickupDate": safe_date(extracted.get("pickupDate")),
            "notes": f"Imported from {filename}. Trucks: {len(trucks_list)}",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }
        new_order = {k: v for k, v in new_order.items() if v is not None and v != ""}
        result = supabase.table("orders").insert(new_order).execute()
        if not result.data:
            raise Exception("Failed to create order in database")
        order = result.data[0]
        logger.info(f"Created order: {order_number} id={order['id']}")

    # Insert truck allocations
    trucks_added = 0
    trucks_skipped = 0
    for t in trucks_list:
        vehicle_reg = (t.get("vehicleReg") or "").strip().upper()
        if not vehicle_reg:
            trucks_skipped += 1
            continue
        try:
            truck_row = {
                "id": str(uuid.uuid4()),
                "orderId": order["id"],
                "vehicleReg": vehicle_reg,
                "status": t.get("status") or "scheduled",
            }
            if t.get("driverName"):
                truck_row["driverName"] = str(t["driverName"]).strip()
            if t.get("transporter"):
                truck_row["transporter"] = str(t["transporter"]).strip()
            if t.get("fleetNo"):
                truck_row["fleetNo"] = str(t["fleetNo"]).strip()
            if t.get("trailer1"):
                truck_row["trailer1"] = str(t["trailer1"]).strip().upper()
            if t.get("trailer2"):
                truck_row["trailer2"] = str(t["trailer2"]).strip().upper()
            if t.get("driverId"):
                truck_row["driverId"] = str(t["driverId"]).strip()
            if t.get("ticketNo"):
                truck_row["ticketNo"] = str(t["ticketNo"]).strip()
            if safe_float(t.get("grossWeight")) is not None:
                truck_row["grossWeight"] = safe_float(t["grossWeight"])
            if safe_float(t.get("tareWeight")) is not None:
                truck_row["tareWeight"] = safe_float(t["tareWeight"])
            if safe_float(t.get("netWeight")) is not None:
                truck_row["netWeight"] = safe_float(t["netWeight"])
            if safe_date(t.get("scheduledDate")):
                truck_row["scheduledDate"] = safe_date(t["scheduledDate"])

            supabase.table("truck_allocations").insert(truck_row).execute()
            trucks_added += 1
        except Exception as e:
            logger.error(f"Failed to insert truck {vehicle_reg}: {e}")
            trucks_skipped += 1

    return {
        "orderId": order["id"],
        "orderNumber": order_number,
        "trucks_added": trucks_added,
        "trucks_skipped": trucks_skipped,
    }

# ============================================
# GEMINI AI EXTRACTION
# ============================================

GEMINI_PROMPT = """You are a data extraction AI for a South African bulk transport management system.

Parse the document and return ONLY a valid JSON object (no markdown, no code fences, just raw JSON):

{
  "orderNumber": "order number string or null",
  "clientName": "mine or company name or null",
  "product": "product code e.g. CHR001 or null",
  "orderQty": total_quantity_tonnes_as_number_or_null,
  "unit": "tons",
  "originAddress": "source mine/site or null",
  "destinationAddress": "destination port or city or null",
  "pickupDate": "YYYY-MM-DD or null",
  "trucks": [
    {
      "vehicleReg": "truck registration plate - REQUIRED",
      "driverName": "driver full name or null",
      "transporter": "transport company name or null",
      "fleetNo": "fleet number or null",
      "trailer1": "first trailer plate or null",
      "trailer2": "second trailer plate or null",
      "driverId": "driver ID number or null",
      "ticketNo": "weighbridge ticket or transaction number or null",
      "grossWeight": gross_kg_as_integer_or_null,
      "tareWeight": tare_kg_as_integer_or_null,
      "netWeight": net_kg_as_integer_or_null,
      "scheduledDate": "YYYY-MM-DD or null",
      "status": "scheduled"
    }
  ]
}

WEIGHBRIDGE DETAIL REPORT (WDR) — Newton system used at South African mines:
- ORDER NUMBER: extract from the "ORDER NUMBER:" summary box at the bottom of the report (e.g. ELD26-05-30, ZDE26-05-46), NOT from the ORDERNO column in the table rows
- clientName: from the report title header e.g. "NORTHAM ELAND", "FARM ZONDEREINDE"
- originAddress: mine name from the report title
- orderQty: from "ORDER QTY:" in the summary box (value is already in tonnes)
- pickupDate: date portion of the "Filter Range" start date, format YYYY-MM-DD
- Each DISP transaction row = one truck entry:
  - TRUCK REG column → vehicleReg (e.g. LGZ388MP)
  - TRAN NO column → ticketNo (e.g. 1001301 or 136262)
  - TARE column → tareWeight in kg (e.g. 19050)
  - GROSS column → grossWeight in kg (e.g. 56950)
  - NETT column → netWeight in kg (e.g. 37900)
  - TRANSPORTER column → transporter (e.g. VRC)
  - PRODUCT column → product (e.g. CHR001)
  - DEST column → destinationAddress (e.g. DBN, BC)
  - SUPPLIER column → originAddress on truck row (can leave null, use report-level originAddress)
  - USER column is a weighbridge OPERATOR, NOT the truck driver — set driverName to null
  - Set status = "completed" for all WDR trucks (they have been weighed and dispatched)

GENERAL RULES:
- Include ALL transaction rows — do not skip or summarise any
- vehicleReg is REQUIRED — skip rows with no truck registration
- Weight values must be plain integers. No units
- All dates must be YYYY-MM-DD
- Return ONLY raw JSON — no explanation, no markdown

DOCUMENT:
"""

def _parse_gemini_response(raw_text: str) -> dict | None:
    """Strip markdown fences and parse JSON from a Gemini response."""
    try:
        raw = raw_text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.IGNORECASE)
        raw = re.sub(r'\s*```$', '', raw)
        data = json.loads(raw.strip())
        logger.info(f"Gemini parsed: {len(data.get('trucks', []))} trucks, order={data.get('orderNumber')}")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error: {e} — raw: {raw_text[:400]}")
        return None

def call_gemini(text: str) -> dict | None:
    """Call Gemini with plain text. Returns parsed dict or None."""
    if not gemini_client:
        return None
    if not text or len(text.strip()) < 50:
        return None
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=GEMINI_PROMPT + text[:30000]
        )
        return _parse_gemini_response(response.text)
    except Exception as e:
        logger.error(f"Gemini text call failed: {e}")
        return None

# ============================================
# PDF UPLOAD — GEMINI NATIVE + IMAGE OCR + TEXT FALLBACK
# ============================================

def _pdf_text_pypdf2(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        parts = [p for page in reader.pages if (p := page.extract_text())]
        return "\n".join(parts)
    except Exception as e:
        logger.error(f"PyPDF2 error: {e}")
        return ""

def extract_pdf_via_ocr(file_bytes: bytes) -> str:
    """
    Convert PDF pages to images with pdf2image + Pillow, then run pytesseract OCR.
    Returns the full extracted text across all pages.
    """
    try:
        from pdf2image import convert_from_bytes  # type: ignore[import]
        import pytesseract  # type: ignore[import]
        from PIL import Image  # type: ignore[import]

        images = convert_from_bytes(file_bytes, dpi=300)
        logger.info(f"pdf2image: {len(images)} page(s)")
        parts = []
        for i, img in enumerate(images, start=1):
            gray = img.convert("L")
            text = pytesseract.image_to_string(gray, config="--psm 6 --oem 3")
            if text.strip():
                parts.append(f"--- PAGE {i} ---\n{text}")
                logger.info(f"Page {i} OCR: {len(text)} chars")
        result = "\n".join(parts)
        logger.info(f"Total OCR text: {len(result)} chars")
        return result
    except ImportError as e:
        logger.warning(f"OCR library missing ({e}) — skipping OCR path")
        return ""
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return ""

@app.post("/api/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a weighbridge / WDR PDF.
    Pipeline: pdf2image + pytesseract OCR → Gemini Flash 2.5 extraction.
    Fallback: PyPDF2 text → Gemini Flash 2.5.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")

    logger.info(f"PDF upload: {file.filename}")
    try:
        contents = await file.read()
        extracted = None

        # Step 1 — pdf2image + pytesseract OCR → Gemini Flash 2.5
        ocr_text = extract_pdf_via_ocr(contents)
        if ocr_text.strip():
            logger.info(f"OCR text ({len(ocr_text)} chars) → Gemini Flash 2.5")
            extracted = call_gemini(ocr_text)

        # Step 2 — PyPDF2 text → Gemini Flash 2.5 (fallback for digital PDFs)
        if not extracted:
            logger.info("OCR empty — falling back to PyPDF2 text extraction")
            pdf_text = _pdf_text_pypdf2(contents)
            if pdf_text.strip():
                logger.info(f"PyPDF2 text ({len(pdf_text)} chars) → Gemini Flash 2.5")
                extracted = call_gemini(pdf_text)

        if not extracted:
            raise HTTPException(
                status_code=422,
                detail="Could not parse this PDF. Ensure it is a Newton weighbridge report (WDR) or a supported order document.",
            )

        summary = save_extracted_to_db(extracted, file.filename)
        return {
            "success": True,
            "message": f"Extracted {summary['trucks_added']} trucks for order {summary['orderNumber']}",
            **summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# STATS & REPORTING
# ============================================

@app.get("/api/stats")
async def get_stats():
    """Aggregated stats for all report pages — orders + truck allocations."""
    if not supabase:
        return {}
    try:
        orders = supabase.table("orders").select("*").execute().data or []
        trucks = supabase.table("truck_allocations").select("*").execute().data or []

        total_orders = len(orders)
        active_orders = sum(1 for o in orders if o.get("status") not in ("completed", "cancelled"))
        total_trucks = len(trucks)

        # Truck status breakdown
        truck_status: dict = {}
        for t in trucks:
            s = t.get("status") or "scheduled"
            truck_status[s] = truck_status.get(s, 0) + 1

        # Product mix from orders
        product_counts: dict = {}
        for o in orders:
            p = (o.get("product") or "Unknown").strip()
            product_counts[p] = product_counts.get(p, 0) + 1
        product_mix = [{"name": k, "value": v} for k, v in sorted(product_counts.items(), key=lambda x: -x[1])]

        # Completed/total trucks per order
        order_truck_map: dict = {}
        for t in trucks:
            oid = t.get("orderId")
            if not oid:
                continue
            if oid not in order_truck_map:
                order_truck_map[oid] = {"total": 0, "completed": 0}
            order_truck_map[oid]["total"] += 1
            if t.get("status") == "completed":
                order_truck_map[oid]["completed"] += 1

        order_completions = [
            {
                "id": o.get("orderNumber") or o["id"][:8],
                "orderNumber": o.get("orderNumber"),
                "clientName": o.get("clientName"),
                "completed": order_truck_map.get(o["id"], {}).get("completed", 0),
                "total": order_truck_map.get(o["id"], {}).get("total", 0),
            }
            for o in orders
        ]

        # Transporter stats
        transporter_map: dict = {}
        for t in trucks:
            name = (t.get("transporter") or "Unknown").strip()
            if name not in transporter_map:
                transporter_map[name] = {"total": 0, "completed": 0}
            transporter_map[name]["total"] += 1
            if t.get("status") == "completed":
                transporter_map[name]["completed"] += 1
        transporter_stats = sorted(
            [
                {
                    "name": k,
                    "total": v["total"],
                    "completed": v["completed"],
                    "score": round((v["completed"] / v["total"]) * 100) if v["total"] > 0 else 0,
                }
                for k, v in transporter_map.items()
            ],
            key=lambda x: -x["total"],
        )

        # Client/mine stats
        client_map: dict = {}
        for o in orders:
            c = (o.get("clientName") or "Unknown").strip()
            if c not in client_map:
                client_map[c] = {"orders": 0, "trucks": 0, "tonnes": 0.0, "product": o.get("product") or ""}
            client_map[c]["orders"] += 1
            client_map[c]["trucks"] += order_truck_map.get(o["id"], {}).get("total", 0)
            client_map[c]["tonnes"] += float(o.get("quantity") or 0)
        client_stats = sorted(
            [{"name": k, "orders": v["orders"], "trucks": v["trucks"], "tonnes": round(v["tonnes"], 2), "product": v["product"]}
             for k, v in client_map.items()],
            key=lambda x: -x["tonnes"],
        )

        return {
            "totalOrders": total_orders,
            "activeOrders": active_orders,
            "totalTrucks": total_trucks,
            "truckStatus": truck_status,
            "productMix": product_mix,
            "orderCompletions": order_completions,
            "transporterStats": transporter_stats,
            "clientStats": client_stats,
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {}


@app.get("/api/trucks")
async def get_all_trucks():
    """All truck allocations across all orders (latest 500)."""
    if not supabase:
        return {"trucks": []}
    try:
        result = supabase.table("truck_allocations").select("*").limit(500).execute()
        return {"trucks": result.data or []}
    except Exception as e:
        logger.error(f"Error fetching all trucks: {e}")
        return {"trucks": []}

# ============================================
# EXCEL EXTRACTION — TEMPLATE ENGINE
# ============================================

def _first_row_texts(ws, row: int) -> list[str]:
    """Return all distinct non-empty string values from a worksheet row (skips merged-cell duplicates)."""
    seen, results = set(), []
    for col in range(1, ws.max_column + 1):
        v = ws.cell(row=row, column=col).value
        if v is not None:
            t = str(v).strip()
            if t and t not in seen:
                seen.add(t)
                results.append(t)
    return results

def _map_headers(header_list: list[str]) -> dict[str, int]:
    """Map normalised header strings → 0-based column index."""
    lookup = {
        "TRANSPORTER": "transporter",
        "FLEET NO": "fleetNo", "FLEET": "fleetNo",
        "HORSE REG": "vehicleReg", "HORSE": "vehicleReg", "VEHICLE REG": "vehicleReg",
        "TRAILER 1": "trailer1", "TRAILER1": "trailer1",
        "TRAILER 2": "trailer2", "TRAILER2": "trailer2",
        "DRIVER NAME SURNAME": "driverName", "DRIVER NAME": "driverName", "DRIVER": "driverName",
        "ID": "driverId", "DRIVER ID": "driverId", "DRIVER ID/NO": "driverId",
        "SCHEDULED DATE": "scheduledDate", "DATE": "scheduledDate",
        "TICKET NO": "ticketNo",
        "GROSS WEIGHT": "grossWeight", "GROSS": "grossWeight",
        "TARE WEIGHT": "tareWeight",  "TARE": "tareWeight",
        "NET WEIGHT": "netWeight",    "NET": "netWeight",
    }
    mapping = {}
    for idx, h in enumerate(header_list):
        key = str(h).strip().upper().rstrip(" *:")
        if key in lookup:
            mapping[lookup[key]] = idx
    return mapping

def _read_truck_row(ws, row: int, col_map: dict, num_cols: int) -> dict | None:
    """Read one data row; return a truck dict or None if the row is fully empty."""
    row_vals = [ws.cell(row=row, column=c).value for c in range(1, num_cols + 1)]
    if all(v is None or str(v).strip() == "" for v in row_vals):
        return None
    truck: dict = {"status": "scheduled"}
    for field, idx in col_map.items():
        v = row_vals[idx] if idx < len(row_vals) else None
        if v is None or str(v).strip() == "":
            continue
        if field in ("grossWeight", "tareWeight", "netWeight"):
            truck[field] = safe_float(v)
        elif field == "fleetNo":
            s = str(v).strip()
            truck[field] = str(int(float(s))) if re.fullmatch(r'\d+(\.\d+)?', s) else s
        else:
            truck[field] = str(v).strip()
    return truck if truck.get("vehicleReg") else None

# --- Template 1: KFTS / Island View ---

def _extract_kfts_template(ws) -> dict | None:
    """
    Row 1 — merged metadata: job reference + 'LOADED DD-MM-YYYY'
    Row 2 — empty
    Row 3 — column headers (TRANSPORTER, FLEET NO, HORSE REG, …)
    Row 4+ — one truck per row; stops at first fully-empty row
    """
    row1_texts = _first_row_texts(ws, 1)
    job_ref, destination, loaded_date = "", "", None
    non_loaded: list[str] = []

    for text in row1_texts:
        # Always try to extract a LOADED date from this cell
        m_date = re.search(r'LOADED\s+(\d{1,2}[-/]\d{1,2}[-/]\d{4})', text, re.IGNORECASE)
        if m_date:
            loaded_date = safe_date(m_date.group(1))
            # Keep any text that isn't the LOADED clause (e.g. order ref in same cell)
            remainder = re.sub(r'LOADED\s+\d{1,2}[-/]\d{1,2}[-/]\d{4}', '', text, flags=re.IGNORECASE).strip()
            if remainder:
                non_loaded.append(remainder)
        else:
            non_loaded.append(text)

    # First non-LOADED cell → "ORDER_REF – DESTINATION"  or two separate cells
    if non_loaded:
        parts = re.split(r'\s*[–—]\s*|\s+-\s+', non_loaded[0], maxsplit=1)
        job_ref = parts[0].strip()
        if len(parts) > 1:
            destination = parts[1].strip()
        elif len(non_loaded) > 1:
            # Client name is in its own cell right next to the order number
            destination = non_loaded[1].strip()

    headers = [str(ws.cell(row=3, column=c).value or "").strip() for c in range(1, ws.max_column + 1)]
    col_map = _map_headers(headers)
    if "vehicleReg" not in col_map:
        return None

    trucks = []
    for row in range(4, ws.max_row + 1):
        truck = _read_truck_row(ws, row, col_map, len(headers))
        if truck is None:
            break
        truck["vehicleReg"] = truck["vehicleReg"].upper()
        trucks.append(truck)

    if not trucks:
        return None

    return {
        "orderNumber": job_ref or None,
        "destinationAddress": destination or None,
        "clientName": destination or None,
        "pickupDate": loaded_date,
        "trucks": trucks,
    }

# --- Template 2: Bulk Connections standard download template ---

def _extract_bulk_template(ws) -> dict | None:
    """
    Row 1  — title containing 'BULK CONNECTIONS'
    Rows 3–9 — label | value order-info fields
    Row 11 — column headers
    Row 12+ — truck data
    """
    title = str(ws.cell(row=1, column=1).value or "")
    if "BULK CONNECTIONS" not in title.upper():
        return None

    field_map = {
        "ORDER NUMBER": "orderNumber",
        "CLIENT": "clientName", "MINE": "clientName",
        "PRODUCT": "product",
        "QUANTITY": "orderQty", "TOTAL QUANTITY": "orderQty",
        "ORIGIN": "originAddress",
        "DESTINATION": "destinationAddress",
        "PICKUP DATE": "pickupDate",
    }
    order_info: dict = {}
    for row in range(3, 10):
        label = str(ws.cell(row=row, column=1).value or "").strip().upper().rstrip(":")
        value = ws.cell(row=row, column=2).value
        if not label or not value:
            continue
        for key, fld in field_map.items():
            if key in label:
                order_info[fld] = str(value).strip()
                break

    headers = [str(ws.cell(row=11, column=c).value or "").strip() for c in range(1, ws.max_column + 1)]
    col_map = _map_headers(headers)
    if "vehicleReg" not in col_map:
        return None

    trucks = []
    for row in range(12, ws.max_row + 1):
        truck = _read_truck_row(ws, row, col_map, len(headers))
        if truck is None:
            break
        truck["vehicleReg"] = truck["vehicleReg"].upper()
        trucks.append(truck)

    if not trucks:
        return None

    result = {**order_info, "trucks": trucks}
    if "pickupDate" in result:
        result["pickupDate"] = safe_date(result["pickupDate"])
    if "orderQty" in result:
        result["orderQty"] = safe_float(result["orderQty"])
    return result

# --- Template 3: Generic auto-detect ---

def _extract_generic_template(ws) -> dict | None:
    """
    Scan first 15 rows for a header row that contains a vehicle-reg column,
    then extract all data rows below it.
    """
    vehicle_kws = {"HORSE REG", "VEHICLE REG", "HORSE", "TRUCK REG"}
    header_row = None
    for row in range(1, min(16, ws.max_row + 1)):
        vals = {str(ws.cell(row=row, column=c).value or "").strip().upper()
                for c in range(1, ws.max_column + 1)}
        if vals & vehicle_kws:
            header_row = row
            break
    if not header_row:
        return None

    headers = [str(ws.cell(row=header_row, column=c).value or "").strip()
               for c in range(1, ws.max_column + 1)]
    col_map = _map_headers(headers)
    if "vehicleReg" not in col_map:
        return None

    trucks = []
    empty_streak = 0
    row = header_row + 1
    while row <= ws.max_row and empty_streak < 3:
        truck = _read_truck_row(ws, row, col_map, len(headers))
        if truck is None:
            empty_streak += 1
        else:
            empty_streak = 0
            truck["vehicleReg"] = truck["vehicleReg"].upper()
            trucks.append(truck)
        row += 1

    return {"trucks": trucks} if trucks else None

# --- Dispatcher ---

def extract_excel_structured(file_bytes: bytes) -> dict | None:
    """
    Try each template in priority order; return the first match or None.
    None signals the caller to fall back to Gemini AI.
    """
    try:
        from openpyxl import load_workbook
        wb = load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active

        for extractor, name in [
            (_extract_kfts_template,    "KFTS / Island View"),
            (_extract_bulk_template,    "Bulk Connections standard"),
            (_extract_generic_template, "Generic auto-detect"),
        ]:
            result = extractor(ws)
            if result:
                logger.info(f"Excel matched '{name}' template — "
                            f"{len(result.get('trucks', []))} trucks, order={result.get('orderNumber')}")
                return result

        logger.info("No Excel template matched — falling back to Gemini AI")
        return None
    except Exception as e:
        logger.error(f"Structured Excel extraction error: {e}")
        return None

# ============================================
# EXCEL UPLOAD — TEMPLATE ENGINE + GEMINI AI
# ============================================

def excel_to_text(file_bytes: bytes) -> str:
    """Convert all sheets of an Excel file to readable text (Gemini fallback)."""
    try:
        xl = pd.ExcelFile(io.BytesIO(file_bytes))
        parts = []
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name, header=None, dtype=str)
            df = df.fillna("")
            parts.append(f"=== SHEET: {sheet_name} ===")
            for _, row in df.iterrows():
                line = " | ".join(str(v).strip() for v in row if str(v).strip())
                if line:
                    parts.append(line)
        return "\n".join(parts)
    except Exception as e:
        logger.error(f"Excel to text error: {e}")
        return ""

@app.post("/api/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload Excel file — template extraction with Gemini AI fallback."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")

    logger.info(f"Excel upload: {file.filename}")
    try:
        contents = await file.read()

        # Step 1: Try structured template extraction (openpyxl)
        extracted = extract_excel_structured(contents)

        # Step 2: Fall back to Gemini AI if no template matched
        if not extracted:
            excel_text = excel_to_text(contents)
            if not excel_text.strip():
                raise HTTPException(status_code=400, detail="Could not read Excel file")
            logger.info(f"Gemini fallback — Excel text ({len(excel_text)} chars):\n{excel_text[:500]}")
            extracted = call_gemini(excel_text)

        if not extracted:
            raise HTTPException(
                status_code=422,
                detail="Could not parse Excel. Ensure the file matches a supported format or use the provided template.",
            )

        # Step 3: Save to database
        summary = save_extracted_to_db(extracted, file.filename)

        return {
            "success": True,
            "message": f"Extracted {summary['trucks_added']} trucks for order {summary['orderNumber']}",
            **summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# EXCEL TEMPLATE DOWNLOAD
# ============================================

@app.get("/api/template/excel")
async def download_excel_template():
    """Download the standard truck allocation Excel template."""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        wb = Workbook()
        ws = wb.active
        ws.title = "Truck Allocation"

        header_fill = PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
        info_fill = PatternFill(start_color="EBF3FF", end_color="EBF3FF", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=11)
        info_font = Font(bold=True, color="1E3A5F", size=10)
        thin = Side(style="thin", color="CCCCCC")
        border = Border(left=thin, right=thin, top=thin, bottom=thin)
        center = Alignment(horizontal="center", vertical="center")

        # Row 1: Title
        ws.merge_cells("A1:H1")
        ws["A1"] = "BULK CONNECTIONS — TRUCK ALLOCATION SHEET"
        ws["A1"].font = Font(bold=True, size=14, color="1E3A5F")
        ws["A1"].alignment = center
        ws.row_dimensions[1].height = 30

        # Rows 3-8: Order info fields
        order_fields = [
            ("Order Number:", "e.g. VRC-2026-05-001"),
            ("Client / Mine Name:", "e.g. Northam Eland"),
            ("Product:", "e.g. Chrome Ore / CHR001"),
            ("Total Quantity (tons):", "e.g. 5000"),
            ("Origin (Mine/Site):", "e.g. Northam Eland Mine"),
            ("Destination:", "e.g. Richards Bay Port"),
            ("Pickup Date:", "e.g. 2026-05-13"),
        ]
        for i, (label, placeholder) in enumerate(order_fields, start=3):
            ws.cell(row=i, column=1, value=label).font = info_font
            ws.cell(row=i, column=1).fill = info_fill
            ws.cell(row=i, column=1).alignment = Alignment(horizontal="right", vertical="center")
            cell = ws.cell(row=i, column=2, value=placeholder)
            cell.font = Font(color="999999", italic=True, size=10)
            ws.merge_cells(f"B{i}:D{i}")

        ws.row_dimensions[10].height = 8  # spacer

        # Row 11: Column headers for truck data
        truck_headers = [
            "TRANSPORTER", "FLEET NO", "HORSE REG *", "TRAILER 1",
            "TRAILER 2", "DRIVER NAME", "DRIVER ID/NO", "SCHEDULED DATE"
        ]
        for col, header in enumerate(truck_headers, start=1):
            cell = ws.cell(row=11, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center
            cell.border = border
        ws.row_dimensions[11].height = 22

        # Sample data rows
        sample_rows = [
            ["VRC Transport", "F001", "LGZ388MP", "TR001", "TR002", "John Dlamini", "8901015800089", "2026-05-13"],
            ["VRC Transport", "F002", "LHT407MP", "TR003", "", "Peter Nkosi", "7805125800082", "2026-05-13"],
            ["VRC Transport", "F003", "LFC145MP", "", "", "Mary Sithole", "9002034800081", "2026-05-14"],
        ]
        sample_fill = PatternFill(start_color="F8FBFF", end_color="F8FBFF", fill_type="solid")
        for row_idx, row_data in enumerate(sample_rows, start=12):
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.fill = sample_fill
                cell.border = border
                cell.alignment = Alignment(vertical="center")
            ws.row_dimensions[row_idx].height = 18

        # Add 20 blank data rows
        blank_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
        for row_idx in range(15, 35):
            for col_idx in range(1, 9):
                ws.cell(row=row_idx, column=col_idx).fill = blank_fill
                ws.cell(row=row_idx, column=col_idx).border = border
            ws.row_dimensions[row_idx].height = 18

        # Column widths
        col_widths = [22, 12, 14, 12, 12, 20, 18, 16]
        for col_idx, width in enumerate(col_widths, start=1):
            ws.column_dimensions[get_column_letter(col_idx)].width = width

        # Note row at bottom
        note_row = 36
        ws.merge_cells(f"A{note_row}:H{note_row}")
        ws.cell(row=note_row, column=1, value="* HORSE REG is required for each row. Delete sample rows before uploading.").font = Font(color="FF0000", italic=True, size=9)

        # Save to buffer
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=truck_allocation_template.xlsx"}
        )
    except Exception as e:
        logger.error(f"Template generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# EXCEL REPORT — REAL DATA FROM DATABASE
# ============================================

@app.get("/api/report/excel/{order_id}")
async def download_order_report(order_id: str):
    """Generate a filled KFTS-style Excel report for an order using live DB data."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        order_res = supabase.table("orders").select("*").eq("id", order_id).execute()
        if not order_res.data:
            raise HTTPException(status_code=404, detail="Order not found")
        order = order_res.data[0]

        trucks_res = supabase.table("truck_allocations").select("*").eq("orderId", order_id).execute()
        trucks = trucks_res.data or []

        wb = Workbook()
        ws = wb.active
        ws.title = "Sheet1"

        order_number = order.get("orderNumber", "")
        destination = order.get("destinationAddress") or order.get("clientName") or ""
        pickup_date = order.get("requestedPickupDate", "") or ""

        header_fill = PatternFill(start_color="1E3A5F", end_color="1E3A5F", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF", size=11)
        alt_fill = PatternFill(start_color="F0F4FA", end_color="F0F4FA", fill_type="solid")
        thin = Side(style="thin", color="CCCCCC")
        border = Border(left=thin, right=thin, top=thin, bottom=thin)
        center = Alignment(horizontal="center", vertical="center")

        # Row 1: KFTS-style metadata (job ref left, loaded date right)
        row1_left = f"{order_number} – {destination}".strip(" –")
        row1_right = f"LOADED {pickup_date}" if pickup_date else "LOADED —"

        ws.merge_cells("A1:D1")
        ws["A1"] = row1_left
        ws["A1"].font = Font(bold=True, size=12, color="1E3A5F")

        ws.merge_cells("E1:G1")
        ws["E1"] = row1_right
        ws["E1"].font = Font(bold=True, size=12, color="1E3A5F")
        ws["E1"].alignment = Alignment(horizontal="right", vertical="center")
        ws.row_dimensions[1].height = 24

        # Row 3: column headers
        col_headers = ["TRANSPORTER", "FLEET NO", "HORSE REG", "TRAILER 1", "TRAILER 2", "DRIVER NAME SURNAME", "ID"]
        for col, h in enumerate(col_headers, start=1):
            cell = ws.cell(row=3, column=col, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center
            cell.border = border
        ws.row_dimensions[3].height = 22

        # Rows 4+: truck data from DB
        for row_idx, truck in enumerate(trucks, start=4):
            row_data = [
                truck.get("transporter", ""),
                truck.get("fleetNo", ""),
                truck.get("vehicleReg", ""),
                truck.get("trailer1", ""),
                truck.get("trailer2", ""),
                truck.get("driverName", ""),
                truck.get("driverId", ""),
            ]
            fill = alt_fill if row_idx % 2 == 0 else None
            for col, val in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col, value=val)
                cell.border = border
                if fill:
                    cell.fill = fill
            ws.row_dimensions[row_idx].height = 18

        for col, width in enumerate([22, 12, 14, 12, 12, 26, 18], start=1):
            ws.column_dimensions[get_column_letter(col)].width = width

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        safe_num = re.sub(r'[^\w\-]', '_', order_number) or order_id[:8]
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={safe_num}_report.xlsx"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
