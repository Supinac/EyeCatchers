import json
import os
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Mapping, Sequence
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle

from .models import GameType

GAME_LABELS_CZ: dict[GameType, str] = {
    GameType.find_all_same: "Najdi všechny stejné",
    GameType.keys: "Klíče",
    GameType.moving_shapes: "Pohyblivé tvary",
}


def _register_utf8_font() -> tuple[str, str]:
    # Use a Unicode font so Czech diacritics render correctly in PDF.
    regular_candidates = [
        # Optional overrides for custom deployments.
        os.getenv("PDF_FONT_REGULAR", ""),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "C:/Windows/Fonts/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
        str(Path(__file__).resolve().parents[1] / "fonts" / "DejaVuSans.ttf"),
    ]
    bold_candidates = [
        os.getenv("PDF_FONT_BOLD", ""),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "C:/Windows/Fonts/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        str(Path(__file__).resolve().parents[1] / "fonts" / "DejaVuSans-Bold.ttf"),
    ]

    regular_path = next((p for p in regular_candidates if p and Path(p).exists()), None)
    bold_path = next((p for p in bold_candidates if p and Path(p).exists()), None)
    if not regular_path or not bold_path:
        raise ValueError("Chybí Unicode font pro UTF-8 PDF (DejaVuSans).")

    regular_name = "DejaVuSans"
    bold_name = "DejaVuSans-Bold"
    if regular_name not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(regular_name, regular_path))
    if bold_name not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(bold_name, bold_path))
    return regular_name, bold_name


def _human_readable_section(section: object) -> str:
    if section is None:
        return "-"

    if isinstance(section, str):
        try:
            section = json.loads(section)
        except (json.JSONDecodeError, TypeError):
            return section

    if not isinstance(section, dict):
        return str(section)

    pairs: list[str] = []
    for raw_key, raw_value in section.items():
        entry = raw_value
        if isinstance(entry, str):
            try:
                entry = json.loads(entry)
            except (json.JSONDecodeError, TypeError):
                entry = None

        if isinstance(entry, dict):
            key = (
                entry.get("translations")
                or entry.get("tranlations")
                or entry.get("key")
                or str(raw_key)
            )
            value = entry.get("value", "")
        else:
            key = str(raw_key)
            value = raw_value

        value_str = _human_readable_value(value)

        pairs.append(f"{key}: {value_str}")

    return ", ".join(pairs) if pairs else "-"


def _format_created(value: object) -> str:
    if isinstance(value, datetime):
        return value.strftime("%d.%m.%Y %H:%M")
    return str(value)


def _human_readable_game(value: GameType) -> str:
    return GAME_LABELS_CZ.get(value, "Neznámá hra")


def _human_readable_value(value: object) -> str:
    if isinstance(value, bool):
        return "Ano" if value else "Ne"
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered == "true":
            return "Ano"
        if lowered == "false":
            return "Ne"
        return value
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def build_userscores_pdf(user_scores: Sequence[Any], user_name_by_id: Mapping[int, str]) -> bytes:
    regular_font, bold_font = _register_utf8_font()

    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    styles["Heading2"].fontName = bold_font

    header_cell_style = ParagraphStyle(
        "HeaderCell",
        parent=styles["BodyText"],
        fontName=bold_font,
        fontSize=11,
        leading=13,
        alignment=1,
        wordWrap="CJK",
    )
    key_cell_style = ParagraphStyle(
        "KeyCell",
        parent=styles["BodyText"],
        fontName=regular_font,
        fontSize=10,
        leading=12,
        wordWrap="CJK",
    )
    value_cell_style = ParagraphStyle(
        "ValueCell",
        parent=styles["BodyText"],
        fontName=regular_font,
        fontSize=10,
        leading=12,
        wordWrap="CJK",
    )

    def _cell(text: object, style: ParagraphStyle) -> Paragraph:
        safe_text = escape(str(text)).replace("\n", "<br/>")
        return Paragraph(safe_text, style)

    story = []

    for idx, score in enumerate(user_scores):
        game_type = _human_readable_game(score.game_type)
        created_text = _format_created(score.created_at)
        username = user_name_by_id.get(score.user_id, f"Neznámý uživatel ({score.user_id})")
        settings_text = _human_readable_section(score.settings)
        results_text = _human_readable_section(score.results)

        story.append(Paragraph(f"{username} - {game_type}, {created_text}", styles["Heading2"]))
        table_data = [
            [_cell("Položka", header_cell_style), _cell("Hodnota", header_cell_style)],
            [_cell("Uživatel", key_cell_style), _cell(username, value_cell_style)],
            [_cell("Typ hry", key_cell_style), _cell(game_type, value_cell_style)],
            [_cell("Nastavení", key_cell_style), _cell(settings_text, value_cell_style)],
            [_cell("Výsledky", key_cell_style), _cell(results_text, value_cell_style)],
            [_cell("Vytvořeno", key_cell_style), _cell(created_text, value_cell_style)],
        ]

        table = Table(table_data, colWidths=[140, 380])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.white),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(table)

        if idx < len(user_scores) - 1:
            story.append(PageBreak())

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()
