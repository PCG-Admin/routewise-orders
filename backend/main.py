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
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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
        from google import genai as _genai
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

Parse the following document and return ONLY a valid JSON object (no markdown, no code fences, just raw JSON) with this structure:

{
  "orderNumber": "e.g. ELD26-05-30 or null",
  "clientName": "mine or company name or null",
  "product": "product code or description or null",
  "orderQty": total_quantity_as_number_or_null,
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
      "grossWeight": gross_kg_as_number_or_null,
      "tareWeight": tare_kg_as_number_or_null,
      "netWeight": net_kg_as_number_or_null,
      "scheduledDate": "YYYY-MM-DD or null",
      "status": "scheduled"
    }
  ]
}

Rules:
- For WEIGHBRIDGE / WDR reports: every transaction row = one truck entry. vehicleReg = TRUCK REG column, ticketNo = TRAN NO column, driverName = USER column, weights are in kg.
- For EXCEL truck lists: every data row = one truck entry.
- Include ALL rows found - do not summarise or skip any.
- vehicleReg is REQUIRED. Skip rows that have no vehicle registration.
- Weights must be plain numbers (integers or decimals). No units in the number.
- All dates must be YYYY-MM-DD format.
- Return ONLY the raw JSON. No explanation. No markdown.

DOCUMENT:
"""

def call_gemini(text: str) -> dict | None:
    """Call Gemini to extract structured data. Returns parsed dict or None on failure."""
    if not gemini_client:
        logger.warning("Gemini not configured")
        return None
    if not text or len(text.strip()) < 50:
        logger.warning("Text too short for Gemini")
        return None
    raw = ""
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=GEMINI_PROMPT + text[:30000]
        )
        raw = response.text.strip()
        # Strip markdown code fences if Gemini wraps the response
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.IGNORECASE)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()
        data = json.loads(raw)
        logger.info(f"Gemini extracted {len(data.get('trucks', []))} trucks, order={data.get('orderNumber')}")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Gemini returned invalid JSON: {e}")
        logger.error(f"Raw (first 500): {raw[:500]}")
        return None
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return None

# ============================================
# PDF UPLOAD — OCR + GEMINI
# ============================================

def extract_pdf_text_pypdf2(file_bytes: bytes) -> str:
    """Fast text extraction using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
        return "\n".join(parts)
    except Exception as e:
        logger.error(f"PyPDF2 error: {e}")
        return ""

def extract_pdf_text_ocr(file_bytes: bytes) -> str:
    """OCR fallback using pdf2image + pytesseract (requires Tesseract binary installed)."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        images = convert_from_bytes(file_bytes, dpi=200)
        parts = []
        for img in images:
            text = pytesseract.image_to_string(img, config='--psm 6')
            if text:
                parts.append(text)
        result = "\n".join(parts)
        logger.info(f"OCR extracted {len(result)} chars from {len(images)} page(s)")
        return result
    except ImportError:
        logger.warning("OCR unavailable: pdf2image/pytesseract not installed")
        return ""
    except Exception as e:
        if "tesseract" in str(e).lower():
            logger.warning("OCR unavailable: Tesseract binary not installed on system")
        else:
            logger.error(f"OCR error: {e}")
        return ""

@app.post("/api/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload weighbridge PDF — OCR + Gemini AI extraction."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")

    logger.info(f"PDF upload: {file.filename}")
    try:
        contents = await file.read()

        # Step 1: Try fast text extraction
        pdf_text = extract_pdf_text_pypdf2(contents)
        logger.info(f"PyPDF2 got {len(pdf_text)} chars")

        # Step 2: If text is too sparse, fall back to OCR
        if len(pdf_text.strip()) < 200:
            logger.info("Text too sparse — falling back to OCR")
            pdf_text = extract_pdf_text_ocr(contents)

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from PDF")

        # Step 3: Gemini AI extraction
        extracted = call_gemini(pdf_text)
        if not extracted:
            raise HTTPException(status_code=422, detail="AI could not parse the PDF content. Ensure the PDF contains readable weighbridge or order data.")

        # Step 4: Save to database
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
# EXCEL UPLOAD — GEMINI AI
# ============================================

def excel_to_text(file_bytes: bytes) -> str:
    """Convert all sheets of an Excel file to readable text for Gemini."""
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
    """Upload Excel file — Gemini AI extraction."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")

    logger.info(f"Excel upload: {file.filename}")
    try:
        contents = await file.read()

        # Convert Excel → readable text
        excel_text = excel_to_text(contents)
        if not excel_text.strip():
            raise HTTPException(status_code=400, detail="Could not read Excel file")

        logger.info(f"Excel text ({len(excel_text)} chars):\n{excel_text[:500]}")

        # Gemini AI extraction
        extracted = call_gemini(excel_text)
        if not extracted:
            raise HTTPException(status_code=422, detail="AI could not parse the Excel content. Try downloading and using the provided template.")

        # Save to database
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
