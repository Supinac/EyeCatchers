"""
report.py — Generate HTML / CSV reports from UserScore records.
Pure stdlib, no external dependencies.
"""

import csv
import io
import json
from datetime import datetime


# ── PDF (one score per page) ────────────────────────────────────

def records_to_pdf(records: list[dict]) -> bytes:
    """Generates a PDF with one score per page using reportlab."""
    from io import BytesIO
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#16213e"),
        spaceAfter=6,
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor("#16213e"),
        spaceAfter=6,
        spaceBefore=12,
    )
    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=12,
    )
    
    elements = []
    
    for idx, r in enumerate(records):
        if idx > 0:
            elements.append(PageBreak())
        
        game = r["game_type"].replace("_", " ").title()
        date = _fmt_date(r.get("created_at"))
        user_label = f'{r.get("user_name", "?")} (#{r["user_id"]})'
        
        # Title
        elements.append(Paragraph(f"Výsledek hry: {game}", title_style))
        
        # Meta information
        meta_text = f"ID: {r['id']} | Uživatel: {user_label} | Datum: {date}"
        elements.append(Paragraph(meta_text, meta_style))
        
        # Settings section
        settings = _ensure_dict(r.get("settings") or {})
        if settings:
            elements.append(Paragraph("Nastavení hry", heading_style))
            table_data = [["Parametr", "Hodnota"]]
            for entry in settings.values():
                entry = _ensure_entry(entry)
                if not entry:
                    continue
                label = entry.get("tranlations", entry.get("key", ""))
                val = _fmt_value(str(entry.get("value", "")))
                table_data.append([label, val])
            
            if len(table_data) > 1:
                table = Table(table_data, colWidths=[3*inch, 2.5*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f0f0f8"), colors.white]),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                elements.append(table)
                elements.append(Spacer(1, 0.2*inch))
        
        # Results section
        results = _ensure_dict(r.get("results") or {})
        if results:
            elements.append(Paragraph("Výsledky", heading_style))
            table_data = [["Parametr", "Hodnota"]]
            for entry in results.values():
                entry = _ensure_entry(entry)
                if not entry:
                    continue
                label = entry.get("tranlations", entry.get("key", ""))
                val = _fmt_value(str(entry.get("value", "")))
                table_data.append([label, val])
            
            if len(table_data) > 1:
                table = Table(table_data, colWidths=[3*inch, 2.5*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f3460")),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f0f0f8"), colors.white]),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                elements.append(table)
    
    doc.build(elements)
    return buffer.getvalue()
def _ensure_dict(value) -> dict:
    """Handle string-encoded JSON at any nesting level."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return {}
    return value if isinstance(value, dict) else {}


def _ensure_entry(entry) -> dict:
    """Each entry inside settings/results might also be a JSON string."""
    if isinstance(entry, str):
        try:
            entry = json.loads(entry)
        except (json.JSONDecodeError, TypeError):
            return {}
    return entry if isinstance(entry, dict) else {}


def _fmt_value(v: str) -> str:
    if v.lower() == "true":  return "Ano"
    if v.lower() == "false": return "Ne"
    return v


def _fmt_date(dt: datetime | str | None) -> str:
    if dt is None:
        return "—"
    if isinstance(dt, datetime):
        return dt.strftime("%d. %m. %Y  %H:%M")
    try:
        return datetime.fromisoformat(str(dt)).strftime("%d. %m. %Y  %H:%M")
    except (ValueError, TypeError):
        return str(dt)


def _section_rows_html(section: dict) -> str:
    section = _ensure_dict(section)
    rows = ""
    for i, entry in enumerate(section.values()):
        entry = _ensure_entry(entry)
        if not entry:
            continue
        bg = "#f0f0f8" if i % 2 == 0 else "#ffffff"
        label = entry.get("tranlations", entry.get("key", ""))
        val = _fmt_value(str(entry.get("value", "")))
        rows += f'<tr style="background:{bg}"><td>{label}</td><td>{val}</td></tr>\n'
    return rows


# ── Single-record HTML ──────────────────────────────────────────

def record_to_html(
    record_id: int,
    user_id: int,
    user_name: str,
    game_type: str,
    settings: dict,
    results: dict,
    created_at: datetime | None,
) -> str:
    game = game_type.replace("_", " ").title()
    date = _fmt_date(created_at)

    html = f"""<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<title>Výsledek hry – {game}</title>
<style>
  body {{ font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; }}
  h1 {{ font-size: 22px; margin-bottom: 4px; }}
  .meta {{ color: #555; font-size: 13px; margin-bottom: 20px; }}
  h2 {{ font-size: 16px; color: #16213e; margin-top: 28px; margin-bottom: 8px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th {{ background: #0f3460; color: #fff; text-align: left; padding: 8px 12px; }}
<body>
import csv
import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
        settings = _ensure_dict(settings)
    if results:
        results = _ensure_dict(results)
    if settings:
        html += f"<h2>Nastavení hry</h2>\n<table>\n<tr><th>Parametr</th><th>Hodnota</th></tr>\n{_section_rows_html(settings)}</table>\n"
    if results:
        html += f"<h2>Výsledky</h2>\n<table>\n<tr><th>Parametr</th><th>Hodnota</th></tr>\n{_section_rows_html(results)}</table>\n"

    html += "</body>\n</html>"
    return html


# ── Multi-record HTML ───────────────────────────────────────────

def records_to_html(records: list[dict]) -> str:
    """Accepts a list of dicts with keys: id, user_id, user_name, game_type, settings, results, created_at"""
    count = len(records)
    parts = [
        "<!DOCTYPE html>\n"
        '<html lang="cs">\n<head>\n<meta charset="utf-8">\n'
        "<title>Export výsledků</title>\n<style>\n"
        "  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #1a1a2e; }\n"
        "  h1 { font-size: 22px; }\n"
        "  .record { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 24px; }\n"
        "  .record h2 { font-size: 18px; margin-top: 0; }\n"
        "  .meta { color: #555; font-size: 13px; margin-bottom: 12px; }\n"
        "  h3 { font-size: 14px; color: #16213e; margin-top: 16px; margin-bottom: 6px; }\n"
        "  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }\n"
        "  th { background: #0f3460; color: #fff; text-align: left; padding: 6px 10px; font-size: 13px; }\n"
        "  td { padding: 5px 10px; border: 1px solid #ccc; font-size: 13px; }\n"
        "  @media print { .record { break-inside: avoid; } body { margin: 0; } }\n"
        "</style>\n</head>\n<body>\n"
        f"<h1>Export výsledků ({count} záznamů)</h1>\n"
    ]

    for r in records:
        game = r["game_type"].replace("_", " ").title()
        date = _fmt_date(r.get("created_at"))
        parts.append(f'<div class="record">\n<h2>{game}</h2>\n')
        parts.append(f'<p class="meta">ID: {r["id"]} | Uživatel: {r.get("user_name", "?")} (#{r["user_id"]}) | Datum: {date}</p>\n')

        settings = _ensure_dict(r.get("settings") or {})
        results = _ensure_dict(r.get("results") or {})
        if settings:
            parts.append(f"<h3>Nastavení</h3>\n<table><tr><th>Parametr</th><th>Hodnota</th></tr>\n{_section_rows_html(settings)}</table>\n")
        if results:
            parts.append(f"<h3>Výsledky</h3>\n<table><tr><th>Parametr</th><th>Hodnota</th></tr>\n{_section_rows_html(results)}</table>\n")

        parts.append("</div>\n")

    parts.append("</body>\n</html>")
    return "".join(parts)


# ── CSV (single or multi) ──────────────────────────────────────

def records_to_csv(records: list[dict]) -> str:
    """Returns a CSV string with BOM for Excel compatibility."""
    buf = io.StringIO()
    buf.write("\ufeff")  # UTF-8 BOM
    w = csv.writer(buf)
    w.writerow(["ID", "Uživatel", "Typ hry", "Datum", "Sekce", "Klíč", "Parametr", "Hodnota"])

    for r in records:
        game = r["game_type"].replace("_", " ").title()
        date = _fmt_date(r.get("created_at"))
        user_label = f'{r.get("user_name", "?")} (#{r["user_id"]})'

        for section_name, section_key in [("Nastavení", "settings"), ("Výsledky", "results")]:
            section = _ensure_dict(r.get(section_key) or {})
            for entry in section.values():
                entry = _ensure_entry(entry)
                if not entry:
                    continue
                w.writerow([
                    r["id"],
                    user_label,
                    game,
                    date,
                    section_name,
                    entry.get("key", ""),
                    entry.get("tranlations", ""),
                    _fmt_value(str(entry.get("value", ""))),
                ])

    return buf.getvalue()
