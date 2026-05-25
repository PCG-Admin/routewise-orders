import re
import logging

logger = logging.getLogger(__name__)


def safe_date(value) -> str | None:
    """Return YYYY-MM-DD string or None. Accepts datetime strings, date objects, etc."""
    if not value:
        return None
    s = str(value).strip()
    m = re.match(r'^(\d{4}-\d{2}-\d{2})', s)
    if m:
        return m.group(1)
    m = re.match(r'^(\d{2})[/-](\d{2})[/-](\d{4})', s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None


def safe_float(value) -> float | None:
    try:
        return float(value) if value not in (None, "", "null") else None
    except (ValueError, TypeError):
        return None
