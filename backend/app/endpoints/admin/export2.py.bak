import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO

from ... import tables, db
from ...admin_auth import auth_admin


router = APIRouter(prefix="/results/export", tags=["Admin - Export"])


@router.get("/pdf")
async def export_userscores_pdf(session: Session = Depends(db.session), admin=Depends(auth_admin)):
    """Export all UserScore records to PDF, one score per page."""

    # Fetch all user scores
    query = select(tables.UserScore)
    result = session.execute(query)
    user_scores = result.scalars().all()

    if not user_scores:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user scores found")

    # Create PDF in memory
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Add each score on a separate page
    for idx, score in enumerate(user_scores):
        story.append(Paragraph(f"User Score #{score.id}", styles["Heading2"]))

        game_type = score.game_type.value if hasattr(score.game_type, "value") else str(score.game_type)

        settings_text = json.dumps(score.settings or {}, ensure_ascii=False, indent=2)
        results_text = json.dumps(score.results or {}, ensure_ascii=False, indent=2)

        # Create score data table
        score_data = [
            ["Field", "Value"],
            ["ID", str(score.id)],
            ["User ID", str(score.user_id)],
            ["Game Type", game_type],
            ["Settings", settings_text],
            ["Results", results_text],
            ["Date", str(score.created_at)],
        ]

        # Build table with styling
        table = Table(score_data, colWidths=[140, 380])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ("WORDWRAP", (0, 0), (-1, -1), True),
        ]))

        story.append(table)
        if idx < len(user_scores) - 1:
            story.append(PageBreak())

    # Build PDF
    doc.build(story)
    pdf_buffer.seek(0)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=userscores_export.pdf"}
    )