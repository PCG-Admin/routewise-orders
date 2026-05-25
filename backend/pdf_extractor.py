import io
import os
import logging
import PyPDF2

logger = logging.getLogger(__name__)


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
        logger.info(f"PyPDF2 extracted {len(result)} characters from {len(reader.pages)} page(s)")
        return result
    except Exception as e:
        logger.error(f"PyPDF2 extraction error: {e}")
        return ""


def extract_text_ocr(file_bytes: bytes) -> str:
    """
    OCR fallback: convert each PDF page to a 300 DPI greyscale image with
    pdf2image, then run pytesseract. Returns combined text or empty string.
    """
    try:
        import shutil
        from pdf2image import convert_from_bytes  # type: ignore[import]
        import pytesseract                         # type: ignore[import]
        from PIL import Image                      # type: ignore[import]

        tesseract_cmd = os.getenv("TESSERACT_CMD", "").strip()
        if not (tesseract_cmd and os.path.isfile(tesseract_cmd)):
            candidates = [
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


def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Full PDF text extraction pipeline:
      1. PyPDF2 — fast text extraction for digital PDFs
      2. OCR    — pdf2image + pytesseract when PyPDF2 yields < 200 chars
    Returns the best text found, or empty string if both fail.
    """
    text = extract_text_pypdf2(file_bytes)

    if len(text.strip()) < 200:
        logger.info(f"PyPDF2 returned only {len(text.strip())} chars — falling back to OCR")
        ocr_text = extract_text_ocr(file_bytes)
        if ocr_text.strip():
            text = ocr_text

    return text
