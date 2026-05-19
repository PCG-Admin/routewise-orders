from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import pandas as pd
import io
import PyPDF2
import google.generativeai as genai
import json
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Bulk Connections API")

# CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase connected!")
except Exception as e:
    print(f"Supabase error: {e}")
    supabase = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini initialized!")
else:
    gemini_model = None

# ============================================
# ROOT ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {"message": "API is running", "status": "healthy"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ============================================
# ORDERS ENDPOINTS
# ============================================

@app.get("/api/orders")
async def get_orders():
    """Get all orders from Supabase"""
    if not supabase:
        return {"orders": [], "error": "Supabase not connected"}
    
    try:
        result = supabase.table("orders").select("*").order("createdAt", desc=True).execute()
        return {"orders": result.data}
    except Exception as e:
        return {"orders": [], "error": str(e)}

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    """Get a single order by ID"""
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
    """Create a new order in Supabase"""
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
    """Update an existing order"""
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
    """Delete an order"""
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
# EXCEL UPLOAD ENDPOINT
# ============================================

def extract_order_info_from_text(text: str) -> dict:
    """Extract order number, company, and date from the top text"""
    result = {"orderNumber": None, "company": None, "date": None}
    
    if not text:
        return result
    
    # Extract order number
    order_patterns = [
        r'([A-Z]+-?\d+-?[A-Z]*\d*)',
        r'([A-Z]{2,}-\d{2,}-\d{2,})',
        r'([A-Z]{2,}\d{2,}-\d{2,})',
    ]
    
    for pattern in order_patterns:
        match = re.search(pattern, text)
        if match:
            result["orderNumber"] = match.group(1).strip()
            break
    
    # Extract company
    company_patterns = [
        r'–\s*([A-Z\s]+?)\s+(?:LOADED|$)',
        r'-\s*([A-Z\s]+?)\s+(?:LOADED|$)',
    ]
    
    for pattern in company_patterns:
        match = re.search(pattern, text)
        if match:
            result["company"] = match.group(1).strip()
            break
    
    # Extract date
    date_match = re.search(r'(\d{2}-\d{2}-\d{4})', text)
    if date_match:
        result["date"] = date_match.group(1)
    
    return result

@app.post("/api/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload and process Excel file with orders and trucks"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        contents = await file.read()
        
        # Read the Excel file
        df = pd.read_excel(io.BytesIO(contents), header=None)
        
        # Get the first cell value (top-left) which contains order info
        first_cell = str(df.iat[0, 0]) if df.shape[0] > 0 and df.shape[1] > 0 else ""
        
        # Extract order info from the first cell
        order_info = extract_order_info_from_text(first_cell)
        
        logger.info(f"Extracted order info: {order_info}")
        
        # Find the header row (where "TRANSPORTER" is located)
        header_row = -1
        header_cols = {"transporter": 0, "fleet_no": 1, "horse_reg": 2, "trailer1": 3, "trailer2": 4, "driver": 5, "id": 6}
        
        for idx, row in df.iterrows():
            for col_idx, val in row.items():
                if isinstance(val, str) and val.upper() == "TRANSPORTER":
                    header_row = idx
                    # Map column indices based on actual position
                    for c, col_val in row.items():
                        if isinstance(col_val, str):
                            if col_val.upper() == "TRANSPORTER":
                                header_cols["transporter"] = c
                            elif col_val.upper() == "FLEET NO":
                                header_cols["fleet_no"] = c
                            elif col_val.upper() == "HORSE REG":
                                header_cols["horse_reg"] = c
                            elif col_val.upper() == "TRAILER 1":
                                header_cols["trailer1"] = c
                            elif col_val.upper() == "TRAILER 2":
                                header_cols["trailer2"] = c
                            elif col_val.upper() in ["DRIVER NAME SURNAME", "DRIVER NAME", "DRIVER"]:
                                header_cols["driver"] = c
                            elif col_val.upper() == "ID":
                                header_cols["id"] = c
                    break
            if header_row != -1:
                break
        
        # Extract truck data
        trucks = []
        if header_row != -1:
            for idx in range(header_row + 1, df.shape[0]):
                row = df.iloc[idx]
                
                # Check if row is empty
                if pd.isna(row.iloc[0]) and pd.isna(row.iloc[1]):
                    break
                
                transporter = str(row[header_cols.get("transporter", 0)]) if pd.notna(row[header_cols.get("transporter", 0)]) else ""
                
                # Skip empty rows
                if not transporter or transporter == "nan":
                    continue
                
                truck = {
                    "transporter": transporter,
                    "fleet_no": str(row[header_cols.get("fleet_no", 1)]) if pd.notna(row[header_cols.get("fleet_no", 1)]) else "",
                    "horse_reg": str(row[header_cols.get("horse_reg", 2)]) if pd.notna(row[header_cols.get("horse_reg", 2)]) else "",
                    "trailer1": str(row[header_cols.get("trailer1", 3)]) if pd.notna(row[header_cols.get("trailer1", 3)]) else "",
                    "trailer2": str(row[header_cols.get("trailer2", 4)]) if pd.notna(row[header_cols.get("trailer2", 4)]) else "",
                    "driver_name": str(row[header_cols.get("driver", 5)]) if pd.notna(row[header_cols.get("driver", 5)]) else "",
                    "driver_id": str(row[header_cols.get("id", 6)]) if pd.notna(row[header_cols.get("id", 6)]) else "",
                }
                
                # Clean up "nan" values
                for key, value in truck.items():
                    if value == "nan" or value == "None":
                        truck[key] = ""
                
                if truck["horse_reg"] or truck["driver_name"]:
                    trucks.append(truck)
        
        # Convert date format from DD-MM-YYYY to YYYY-MM-DD
        pickup_date = None
        if order_info.get("date"):
            try:
                date_parts = order_info["date"].split('-')
                if len(date_parts) == 3:
                    pickup_date = f"20{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
            except:
                pickup_date = None
        
        # Create the order
        order_data = {
            "orderNumber": order_info.get("orderNumber", f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            "clientName": order_info.get("company", ""),
            "product": "General Cargo",
            "quantity": len(trucks),
            "unit": "trucks",
            "status": "pending",
            "priority": "normal",
            "requestedPickupDate": pickup_date,
            "notes": f"Excel upload from {file.filename}. Total trucks: {len(trucks)}",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }
        
        # Insert order into Supabase
        result = supabase.table("orders").insert(order_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        order = result.data[0]
        
        # Add all trucks as allocations
        trucks_added = 0
        for truck in trucks:
            try:
                truck_allocation = {
                    "id": str(uuid.uuid4()),
                    "orderId": order["id"],
                    "tenantId": "test-tenant-id",
                    "vehicleReg": truck.get("horse_reg", ""),
                    "driverName": truck.get("driver_name", ""),
                    "driverId": truck.get("driver_id", ""),
                    "transporter": truck.get("transporter", ""),
                    "trailer1": truck.get("trailer1", ""),
                    "trailer2": truck.get("trailer2", ""),
                    "fleetNo": truck.get("fleet_no", ""),
                    "status": "scheduled",
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat(),
                }
                
                # Remove empty values
                truck_allocation = {k: v for k, v in truck_allocation.items() if v and v != ""}
                
                supabase.table("truck_allocations").insert(truck_allocation).execute()
                trucks_added += 1
                
            except Exception as e:
                logger.error(f"Error adding truck: {e}")
        
        return {
            "success": True,
            "message": f"Excel processed successfully",
            "order": {
                "id": order["id"],
                "orderNumber": order["orderNumber"],
                "clientName": order["clientName"],
                "pickupDate": pickup_date,
                "total_trucks": len(trucks),
                "trucks_added": trucks_added
            },
            "extracted_info": {
                "order_number": order_info.get("orderNumber"),
                "company": order_info.get("company"),
                "date": order_info.get("date")
            }
        }
        
    except Exception as e:
        logger.error(f"Excel upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PDF UPLOAD ENDPOINT
# ============================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""

@app.post("/api/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and parse weighbridge PDF"""
    
    logger.info(f"Processing PDF: {file.filename}")
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        contents = await file.read()
        pdf_text = extract_text_from_pdf(contents)
        
        if not pdf_text:
            return {"success": False, "error": "Could not extract text from PDF"}
        
        # Basic extraction from PDF text
        result = {"orderNumber": None, "transactions": []}
        
        # Extract order number
        order_match = re.search(r'ORDER NUMBER:(\S+)', pdf_text)
        if order_match:
            result["orderNumber"] = order_match.group(1).strip()
        
        # Extract transactions
        transaction_pattern = re.compile(
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+'  # Date
            r'\d+\s+N/A\s+([A-Z]+)\s+'  # Driver
            r'(\S+)\s+DISP\s+'  # Order
            r'(\d+)\s+(\d+)\s+(\d+)\s+'  # Weights
            r'(\S+)\s+(\S+)\s+(.+)',  # Ticket, Vehicle, Transporter
            re.DOTALL
        )
        
        matches = transaction_pattern.findall(pdf_text)
        for match in matches:
            result["transactions"].append({
                "transactionDate": match[0],
                "driverName": match[1],
                "orderNumber": match[2],
                "grossWeight": int(match[3]),
                "tareWeight": int(match[4]),
                "netWeight": int(match[5]),
                "ticketNo": match[6],
                "vehicleReg": match[7],
                "transporter": match[8].strip()
            })
        
        # Create order if not exists
        existing_order = None
        if result["orderNumber"]:
            existing = supabase.table("orders").select("*").eq("orderNumber", result["orderNumber"]).execute()
            if existing.data:
                existing_order = existing.data[0]
        
        if not existing_order and result["orderNumber"]:
            new_order = {
                "id": str(uuid.uuid4()),
                "orderNumber": result["orderNumber"],
                "status": "pending",
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat(),
            }
            order_result = supabase.table("orders").insert(new_order).execute()
            order = order_result.data[0] if order_result.data else new_order
        elif existing_order:
            order = existing_order
        else:
            order = None
        
        # Add truck transactions
        trucks_added = 0
        if order:
            for trans in result["transactions"]:
                if trans.get("vehicleReg"):
                    truck = {
                        "id": str(uuid.uuid4()),
                        "orderId": order["id"],
                        "tenantId": "test-tenant-id",
                        "vehicleReg": trans.get("vehicleReg", ""),
                        "driverName": trans.get("driverName", ""),
                        "transporter": trans.get("transporter", ""),
                        "grossWeight": trans.get("grossWeight"),
                        "tareWeight": trans.get("tareWeight"),
                        "netWeight": trans.get("netWeight"),
                        "ticketNo": trans.get("ticketNo", ""),
                        "scheduledDate": trans.get("transactionDate"),
                        "status": "completed",
                        "createdAt": datetime.now().isoformat(),
                    }
                    truck = {k: v for k, v in truck.items() if v is not None}
                    supabase.table("truck_allocations").insert(truck).execute()
                    trucks_added += 1
        
        return {
            "success": True,
            "orderNumber": result["orderNumber"],
            "transactions_found": len(result["transactions"]),
            "trucks_added": trucks_added
        }
        
    except Exception as e:
        logger.error(f"PDF upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TRUCK ALLOCATIONS ENDPOINTS
# ============================================

@app.get("/api/orders/{order_id}/trucks")
async def get_order_trucks(order_id: str):
    """Get all truck allocations for a specific order"""
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
            })
        return {"trucks": trucks}
    except Exception as e:
        return {"trucks": []}

@app.post("/api/orders/{order_id}/trucks")
async def add_truck_to_order(order_id: str, truck_data: dict):
    """Add a truck allocation to an order"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        new_truck = {
            "id": str(uuid.uuid4()),
            "orderId": order_id,
            "tenantId": "test-tenant-id",
            "vehicleReg": truck_data.get("plate", ""),
            "driverName": truck_data.get("driver", ""),
            "driverPhone": truck_data.get("phone", ""),
            "transporter": truck_data.get("transporter", ""),
            "status": truck_data.get("status", "scheduled"),
            "scheduledDate": truck_data.get("scheduledDate"),
            "ticketNo": truck_data.get("ticketNo", ""),
            "netWeight": float(truck_data.get("netWeight", 0)) if truck_data.get("netWeight") else 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }
        new_truck = {k: v for k, v in new_truck.items() if v is not None}
        
        result = supabase.table("truck_allocations").insert(new_truck).execute()
        return {"message": "Truck added successfully", "truck": result.data[0] if result.data else new_truck}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/orders/{order_id}/trucks/{truck_id}")
async def update_truck_allocation(order_id: str, truck_id: str, truck_data: dict):
    """Update a truck allocation"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        update_data = {k: v for k, v in truck_data.items() if v is not None}
        result = supabase.table("truck_allocations").update(update_data).eq("id", truck_id).eq("orderId", order_id).execute()
        return {"message": "Truck updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/orders/{order_id}/trucks/{truck_id}")
async def delete_truck_allocation(order_id: str, truck_id: str):
    """Delete a truck allocation"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        supabase.table("truck_allocations").delete().eq("id", truck_id).eq("orderId", order_id).execute()
        return {"message": "Truck deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)