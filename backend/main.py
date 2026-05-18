from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, List
import io
import os
from dotenv import load_dotenv
import PyPDF2
from datetime import datetime
import json
import openpyxl
from openpyxl import load_workbook

load_dotenv()

app = FastAPI(title="Bulk Connections API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
async def root():
    return {"message": "API is running", "status": "healthy"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload Excel file and process orders"""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "File must be Excel format")
    
    contents = await file.read()
    
    # Use openpyxl directly without pandas
    workbook = load_workbook(io.BytesIO(contents))
    sheet = workbook.active
    
    orders = []
    for row in sheet.iter_rows(min_row=2, values_only=True):  # Skip header
        if row[0]:  # If order number exists
            order = {
                "orderNumber": str(row[0]) if row[0] else "",
                "clientName": str(row[1]) if row[1] else "",
                "product": str(row[2]) if row[2] else "",
                "quantity": float(row[3]) if row[3] else 0,
                "originAddress": str(row[4]) if row[4] else "",
                "destinationAddress": str(row[5]) if row[5] else "",
                "tenantId": "test-tenant-id",  # Replace with actual tenant ID
                "status": "pending",
                "createdAt": datetime.now().isoformat()
            }
            orders.append(order)
    
    # Insert into Supabase
    for order in orders:
        try:
            supabase.table("orders").insert(order).execute()
        except Exception as e:
            print(f"Error inserting order: {e}")
    
    return {"message": f"Processed {len(orders)} orders", "orders": orders}

@app.get("/api/orders")
async def get_orders():
    """Get all orders"""
    try:
        result = supabase.table("orders").select("*").limit(100).execute()
        return {"orders": result.data}
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)