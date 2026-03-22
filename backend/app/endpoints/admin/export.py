import json
from io import BytesIO
from pathlib import Path
from datetime import datetime
import os

from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app import tables
from ... import db
from ...admin_auth import auth_admin
from ...models import GameType

router = APIRouter(prefix="/results/export", tags=["Admin - Export"])

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
        str(Path(__file__).resolve().parents[3] / "fonts" / "DejaVuSans.ttf"),
    ]
    bold_candidates = [
        os.getenv("PDF_FONT_BOLD", ""),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        "C:/Windows/Fonts/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        str(Path(__file__).resolve().parents[3] / "fonts" / "DejaVuSans-Bold.ttf"),
    ]

    regular_path = next((p for p in regular_candidates if p and Path(p).exists()), None)
    bold_path = next((p for p in bold_candidates if p and Path(p).exists()), None)
    if not regular_path or not bold_path:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chybí Unicode font pro UTF-8 PDF (DejaVuSans).",
        )

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

        if isinstance(value, bool):
            value_str = "Ano" if value else "Ne"
        elif isinstance(value, (dict, list)):
            value_str = json.dumps(value, ensure_ascii=False)
        else:
            value_str = str(value)

        pairs.append(f"{key}: {value_str}")

    return ", ".join(pairs) if pairs else "-"


def _format_created(value: object) -> str:
    if isinstance(value, datetime):
        return value.strftime("%d.%m.%Y %H:%M")
    return str(value)


def _human_readable_game(value: GameType) -> str:
    return GAME_LABELS_CZ.get(value, "Neznámá hra")

@router.get("/pdf")
async def export_userscores_pdf(
    session: Session = Depends(db.session),
    admin=Depends(auth_admin),
    user_id: int | None = None,
    last_date: bool = Query(False, description="When true, return only rows from the latest created_at."),
):
    # Start from all scores and apply optional user filter.
    stmt = select(tables.UserScore)
    if user_id is not None:
        stmt = stmt.where(tables.UserScore.user_id == user_id)

    # If requested, keep only rows from the latest created_at in the filtered set.
    if last_date:
        latest_stmt = select(func.max(tables.UserScore.created_at))
        if user_id is not None:
            latest_stmt = latest_stmt.where(tables.UserScore.user_id == user_id)

        latest_created_at = session.execute(latest_stmt).scalar_one_or_none()
        if latest_created_at is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user scores found")

        stmt = stmt.where(tables.UserScore.created_at == latest_created_at)

    user_scores = session.execute(stmt).scalars().all()
    if not user_scores:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user scores found")

    user_ids = {score.user_id for score in user_scores}
    user_rows = session.execute(
        select(tables.User.id, tables.User.name).where(tables.User.id.in_(user_ids))
    ).all()
    user_name_by_id = {row.id: row.name for row in user_rows}

    # Create PDF
    regular_font, bold_font = _register_utf8_font()

    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    styles["Heading2"].fontName = bold_font
    story = []

    for idx, score in enumerate(user_scores):
        game_type = _human_readable_game(score.game_type)
        created_text = _format_created(score.created_at)
        username = user_name_by_id.get(score.user_id, f"Neznámý uživatel ({score.user_id})")
        settings_text = _human_readable_section(score.settings)
        results_text = _human_readable_section(score.results)

        story.append(Paragraph(f"{username} - {game_type}, {created_text}", styles["Heading2"]))
        table_data = [
            ["Položka", "Hodnota"],
            ["Uživatel", username],
            ["Typ hry", game_type],
            ["Nastavení", settings_text],
            ["Výsledky", results_text],
            ["Vytvořeno", created_text],
        ]

        table = Table(table_data, colWidths=[140, 380])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.white),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTNAME", (0, 0), (-1, 0), bold_font),
            ("FONTNAME", (0, 1), (-1, -1), regular_font),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("FONTSIZE", (0, 1), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)

        if idx < len(user_scores) - 1:
            story.append(PageBreak())

    doc.build(story)
    pdf_buffer.seek(0)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=userscores_export.pdf"},
    )