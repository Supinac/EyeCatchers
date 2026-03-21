"""
report.py — Generate HTML / CSV reports from UserScore records.
Pure stdlib, no external dependencies.
"""

import csv
import io
from datetime import datetime


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
    rows = ""
    for i, entry in enumerate(section.values()):
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
  td {{ padding: 6px 12px; border: 1px solid #ccc; }}
  @media print {{ body {{ margin: 0; }} }}
</style>
</head>
<body>
<h1>Výsledek hry: {game}</h1>
<p class="meta">ID: {record_id} | Uživatel: {user_name} (#{user_id}) | Datum: {date}</p>
"""
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

        settings = r.get("settings") or {}
        results = r.get("results") or {}
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
            section = r.get(section_key) or {}
            for entry in section.values():
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
