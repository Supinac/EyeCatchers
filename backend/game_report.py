#!/usr/bin/env python3
"""
game_report.py — Transforms game result JSON into HTML + CSV reports.
No external dependencies — pure Python stdlib.

Usage:
    python3 game_report.py                        # built-in example
    python3 game_report.py data.json              # from file
    python3 game_report.py data.json -f html      # HTML only
    python3 game_report.py data.json -f csv       # CSV only
"""

import json, sys, csv, argparse
from datetime import datetime
from pathlib import Path

# ── Hardcoded example ───────────────────────────────────────────

EXAMPLE_DATA = {
    "id": 1,
    "user_id": 1,
    "game_type": "find_all_same",
    "settings": {
        "difficulty":         {"key": "difficulty",         "tranlations": "Obtížnost",                    "value": "easy"},
        "previewTime":        {"key": "previewTime",        "tranlations": "Doba náhledu",                 "value": "5"},
        "maxGameTime":        {"key": "maxGameTime",        "tranlations": "Maximální čas hry",            "value": "60"},
        "gridSize":           {"key": "gridSize",           "tranlations": "Velikost mřížky",              "value": "3x3"},
        "correctObjectCount": {"key": "correctObjectCount", "tranlations": "Počet správných objektů",      "value": "3"},
        "figureSizeMode":     {"key": "figureSizeMode",     "tranlations": "Režim velikosti objektů",      "value": "fixed"},
        "figureSizePercent":  {"key": "figureSizePercent",  "tranlations": "Velikost objektů v procentech","value": "85"},
        "contentMode":        {"key": "contentMode",        "tranlations": "Režim obsahu",                 "value": "figures"},
        "placementMode":      {"key": "placementMode",      "tranlations": "Rozložení objektů",            "value": "grid"},
        "targetValue":        {"key": "targetValue",        "tranlations": "Hledaný objekt",               "value": "diamond"},
    },
    "results": {
        "score":             {"key": "score",             "tranlations": "Skóre",                        "value": "3"},
        "maxScore":          {"key": "maxScore",          "tranlations": "Maximální skóre",              "value": "3"},
        "success":           {"key": "success",           "tranlations": "Úspěch",                       "value": "true"},
        "correctHits":       {"key": "correctHits",       "tranlations": "Počet správných kliknutí",     "value": "3"},
        "wrongHits":         {"key": "wrongHits",         "tranlations": "Počet špatných kliknutí",      "value": "0"},
        "totalTaps":         {"key": "totalTaps",         "tranlations": "Celkový počet kliknutí",       "value": "3"},
        "accuracyPercent":   {"key": "accuracyPercent",   "tranlations": "Přesnost v procentech",        "value": "100"},
        "elapsedSeconds":    {"key": "elapsedSeconds",    "tranlations": "Použitý čas v sekundách",      "value": "1"},
        "remainingSeconds":  {"key": "remainingSeconds",  "tranlations": "Zbývající čas v sekundách",    "value": "59"},
    },
    "created_at": "2026-03-21T17:45:51",
}


def fmt_value(v: str) -> str:
    if v.lower() == "true":  return "Ano"
    if v.lower() == "false": return "Ne"
    return v


def fmt_date(s: str) -> str:
    try:
        return datetime.fromisoformat(s).strftime("%d. %m. %Y  %H:%M")
    except (ValueError, TypeError):
        return s


# ── HTML generation ─────────────────────────────────────────────

def generate_html(data: dict, path: str):
    game = data.get("game_type", "?").replace("_", " ").title()
    date = fmt_date(data.get("created_at", ""))

    def table_rows(section: dict) -> str:
        rows = ""
        for i, entry in enumerate(section.values()):
            bg = "#f0f0f8" if i % 2 == 0 else "#ffffff"
            label = entry.get("tranlations", entry.get("key", ""))
            val = fmt_value(str(entry.get("value", "")))
            rows += f'<tr style="background:{bg}"><td>{label}</td><td>{val}</td></tr>\n'
        return rows

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
<p class="meta">ID: {data.get("id","?")} | Uživatel: {data.get("user_id","?")} | Datum: {date}</p>
"""
    if "settings" in data:
        html += f"<h2>Nastavení hry</h2>\n<table>\n<tr><th>Parametr</th><th>Hodnota</th></tr>\n{table_rows(data['settings'])}</table>\n"
    if "results" in data:
        html += f"<h2>Výsledky</h2>\n<table>\n<tr><th>Parametr</th><th>Hodnota</th></tr>\n{table_rows(data['results'])}</table>\n"

    html += "</body>\n</html>"
    Path(path).write_text(html, encoding="utf-8")
    print(f"  HTML → {path}")


# ── CSV generation ──────────────────────────────────────────────

def generate_csv(data: dict, path: str):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["Sekce", "Klíč", "Parametr", "Hodnota"])
        for section_name, section_key in [("Nastavení", "settings"), ("Výsledky", "results")]:
            section = data.get(section_key, {})
            for entry in section.values():
                w.writerow([
                    section_name,
                    entry.get("key", ""),
                    entry.get("tranlations", ""),
                    fmt_value(str(entry.get("value", ""))),
                ])
    print(f"  CSV  → {path}")


# ── CLI ─────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Game result JSON → HTML + CSV")
    p.add_argument("input", nargs="?", default=None, help="JSON file (omit for built-in example)")
    p.add_argument("-f", "--format", choices=["html", "csv", "both"], default="both")
    p.add_argument("-o", "--output", default="game_report", help="Output name without extension")
    args = p.parse_args()

    if args.input is None:
        print("No input file — using built-in example.")
        data = EXAMPLE_DATA
    elif args.input == "-":
        data = json.loads(sys.stdin.read())
    else:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))

    records = data if isinstance(data, list) else [data]

    for i, rec in enumerate(records):
        suffix = f"_{i+1}" if len(records) > 1 else ""
        base = f"{args.output}{suffix}"
        print(f"Record {i+1}/{len(records)} (game_id={rec.get('id', '?')}):")
        if args.format in ("html", "both"):
            generate_html(rec, f"{base}.html")
        if args.format in ("csv", "both"):
            generate_csv(rec, f"{base}.csv")

    print("Done.")


if __name__ == "__main__":
    main()
