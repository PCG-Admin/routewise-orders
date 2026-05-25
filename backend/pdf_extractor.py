import io
import os
import re
import logging
import PyPDF2

logger = logging.getLogger(__name__)


# ── Compiled regexes for Newton WDR line detection ───────────────────────────
#
# Each DISP transaction row looks like (space-separated after normalisation):
#   DATE       TIME      TRAN_NO  MINE_TRANS  USER    ORDERNO       DISP  TARE   GROSS  NETT   PRODUCT  TRUCK_REG  TRANSPORTER SUPPLIER DEST
#   2026-05-13 17:48:16  1001301  1000254     MANTOA  ELD26-05-30   DISP  19050  56950  37900  CHR001   LGZ388MP   VRC         EL       BC
#   2026-05-13 08:00     136262   N/A         EDDIE   ZDE26-05-46   DISP  18700  56250  37550  CHR001   LLM410MP   VRC         MET      DBN

_DISP_ROW = re.compile(
    r'(\d{4}-\d{2}-\d{2})'                     # [1]  date YYYY-MM-DD
    r'[\s|]+[\d:]+[\s|]+'                       #      time HH:MM or HH:MM:SS  (ignored)
    r'(\d+)[\s|]+'                              # [2]  tran_no
    r'(\S+)[\s|]+'                              # [3]  mine_trans (number or N/A)
    r'(\S+)[\s|]+'                              # [4]  user / operator name
    r'([A-Z]{2,4}\d{2}-\d{2}-\d+)[\s|]+'      # [5]  order_no   e.g. ELD26-05-30
    r'DISP[\s|]+'                               #      tran_type must be DISP
    r'(\d+)[\s|]+'                              # [6]  tare (kg)
    r'(\d+)[\s|]+'                              # [7]  gross (kg)
    r'(\d+)[\s|]+'                              # [8]  nett (kg)
    r'([A-Z0-9]{3,10})[\s|]+'                  # [9]  product code e.g. CHR001
    r'([A-Z]{1,3}\d{1,4}[A-Z0-9]{1,6})[\s|]+' # [10] truck_reg   e.g. LGZ388MP, MT79MYGP
    r'(\S+)[\s|]+'                              # [11] transporter e.g. VRC
    r'(\S+)[\s|]+'                              # [12] supplier    e.g. EL, MET
    r'(\S+)',                                    # [13] dest        e.g. BC, DBN
    re.IGNORECASE,
)

_ORDER_NO    = re.compile(r'ORDER\s+NUMBER\s*:?\s*([A-Z]{2,4}\d{2}-\d{2}-\d+)', re.IGNORECASE)
_ORDER_QTY   = re.compile(r'ORDER\s+QTY\s*:?\s*([\d,.]+)', re.IGNORECASE)
_CLIENT_NAME = re.compile(r'WEIGHB\w+GE\s+DETAILS\s+REPORT\s+([^\n|]+)', re.IGNORECASE)
_FILTER_DATE = re.compile(r'Filter\s+Range\s*:?\s*(\d{4}-\d{2}-\d{2})', re.IGNORECASE)


# ── Stage 1: pdfplumber (primary) ────────────────────────────────────────────

def extract_text_pdfplumber(file_bytes: bytes) -> str:
    """
    Extract text from a PDF using pdfplumber.
    Combines free-form prose text with tables formatted as pipe-delimited rows
    so that column data stays aligned for the regex parser and Gemini.
    """
    try:
        import pdfplumber  # type: ignore[import]

        pages_out = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                parts = []

                prose = page.extract_text()
                if prose and prose.strip():
                    parts.append(prose.strip())

                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and any(cell for cell in row if cell):
                            line = " | ".join(str(cell).strip() if cell else "" for cell in row)
                            if line.strip(" |"):
                                parts.append(line)

                if parts:
                    pages_out.append(f"--- PAGE {i} ---\n" + "\n".join(parts))

        result = "\n".join(pages_out)
        logger.info(f"pdfplumber extracted {len(result)} chars from {len(pages_out)} page(s)")
        return result

    except ImportError:
        logger.warning("pdfplumber not installed — skipping")
        return ""
    except Exception as e:
        logger.error(f"pdfplumber extraction error: {e}")
        return ""


# ── Stage 2: PyPDF2 (secondary fallback) ─────────────────────────────────────

def extract_text_pypdf2(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyPDF2. Returns empty string on failure."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text and text.strip():
                pages.append(text)
        result = "\n".join(pages)
        logger.info(f"PyPDF2 extracted {len(result)} chars from {len(reader.pages)} page(s)")
        return result
    except Exception as e:
        logger.error(f"PyPDF2 extraction error: {e}")
        return ""


# ── Stage 3: Tesseract OCR (scanned PDF fallback) ────────────────────────────

def extract_text_ocr(file_bytes: bytes) -> str:
    """
    OCR fallback for scanned PDFs: pdf2image converts each page to a 300 DPI
    greyscale image, then pytesseract reads the text.
    """
    try:
        import shutil
        from pdf2image import convert_from_bytes  # type: ignore[import]
        import pytesseract                         # type: ignore[import]

        tesseract_cmd = os.getenv("TESSERACT_CMD", "").strip()
        if not (tesseract_cmd and os.path.isfile(tesseract_cmd)):
            candidates = [
                "/usr/bin/tesseract",
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
                shutil.which("tesseract") or "",
            ]
            tesseract_cmd = next((p for p in candidates if p and os.path.isfile(p)), "")

        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            logger.info(f"Tesseract binary: {tesseract_cmd}")
        else:
            logger.warning("Tesseract binary not found — OCR unavailable")
            return ""

        images = convert_from_bytes(file_bytes, dpi=300)
        logger.info(f"pdf2image: {len(images)} page(s) at 300 DPI")

        pages = []
        for i, img in enumerate(images, start=1):
            grey = img.convert("L")
            text = pytesseract.image_to_string(grey, config="--psm 6 --oem 3 -l eng")
            if text.strip():
                pages.append(f"--- PAGE {i} ---\n{text}")
                logger.info(f"OCR page {i}: {len(text)} chars")

        result = "\n".join(pages)
        logger.info(f"OCR total: {len(result)} chars")
        return result

    except ImportError as e:
        logger.warning(f"OCR dependency missing: {e}")
        return ""
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""


# ── Text extraction orchestrator ──────────────────────────────────────────────

def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Full PDF text extraction pipeline — returns the best text found:
      1. pdfplumber  — preserves table layout (best for WDR/Newton reports)
      2. PyPDF2      — fast digital fallback if pdfplumber fails
      3. Tesseract   — OCR for scanned PDFs when text extraction yields < 200 chars
    """
    text = extract_text_pdfplumber(file_bytes)
    if len(text.strip()) >= 200:
        logger.info("Using pdfplumber text")
        return text

    logger.info(f"pdfplumber yielded {len(text.strip())} chars — trying PyPDF2")
    text = extract_text_pypdf2(file_bytes)
    if len(text.strip()) >= 200:
        logger.info("Using PyPDF2 text")
        return text

    logger.info(f"PyPDF2 yielded {len(text.strip())} chars — falling back to OCR")
    ocr_text = extract_text_ocr(file_bytes)
    if ocr_text.strip():
        logger.info("Using OCR text")
        return ocr_text

    return text


# ── Stage 4: Line Detection → Regex Parsing → Structured JSON ────────────────

def parse_wdr_text(text: str) -> dict | None:
    """
    Direct regex parser for Newton WDR (Weighbridge Detail Report) PDFs.

    Pipeline:
      Text Extraction  →  Line Detection  →  Regex Parsing  →  Structured JSON

    Returns the same dict structure Gemini would produce so callers are
    interchangeable.  Returns None if no DISP rows are found (non-WDR PDF
    or text too garbled — caller should fall back to Gemini).
    """
    # Normalise: collapse pipe separators from pdfplumber table output → spaces
    normalised = re.sub(r'\s*\|\s*', ' ', text)
    normalised = re.sub(r'[ \t]+', ' ', normalised)

    # ── Line Detection + Regex Parsing ────────────────────────────────────────
    trucks: list[dict] = []
    first_product: str | None = None
    first_dest: str | None = None

    for m in _DISP_ROW.finditer(normalised):
        (date, tran_no, _mine_trans, _user, _order_no,
         tare, gross, nett, product, truck_reg,
         transporter, _supplier, dest) = m.groups()

        if first_product is None:
            first_product = product.upper()
        if first_dest is None:
            first_dest = dest.upper()

        trucks.append({
            "vehicleReg":   truck_reg.upper(),
            "ticketNo":     tran_no.strip(),
            "transporter":  transporter.strip(),
            "tareWeight":   int(tare),
            "grossWeight":  int(gross),
            "netWeight":    int(nett),
            "scheduledDate": date,
            "status":       "completed",
        })

    if not trucks:
        logger.info("WDR regex: no DISP rows matched — not a WDR or text too garbled")
        return None

    # ── Extract order metadata from summary / header section ─────────────────
    order_no_m  = _ORDER_NO.search(normalised)
    qty_m       = _ORDER_QTY.search(normalised)
    client_m    = _CLIENT_NAME.search(normalised)
    date_m      = _FILTER_DATE.search(normalised)

    order_number = order_no_m.group(1).strip() if order_no_m else None

    raw_qty = qty_m.group(1).replace(",", "").strip() if qty_m else None
    try:
        order_qty: float | None = float(raw_qty) if raw_qty else None
    except ValueError:
        order_qty = None

    client_name: str | None = None
    if client_m:
        raw_client = client_m.group(1).strip()
        # Strip trailing tokens that are mine codes / location tags
        # e.g. "FARM ZONDEREINDE KQ384 THABAZIMBI" → "FARM ZONDEREINDE"
        client_name = re.split(r'\s+(?:Printed|KQ\d|Search|\d{4})', raw_client, flags=re.IGNORECASE)[0].strip()

    pickup_date = date_m.group(1) if date_m else trucks[0]["scheduledDate"]

    logger.info(
        f"WDR regex parsed: order={order_number}, client={client_name}, "
        f"trucks={len(trucks)}, product={first_product}"
    )

    # ── Structured JSON output ────────────────────────────────────────────────
    return {
        "orderNumber":        order_number,
        "clientName":         client_name,
        "product":            first_product,
        "orderQty":           order_qty,
        "unit":               "tons",
        "originAddress":      client_name,
        "destinationAddress": first_dest,
        "pickupDate":         pickup_date,
        "trucks":             trucks,
    }
