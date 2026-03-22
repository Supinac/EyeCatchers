from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app import tables
from app.pdf_export import build_userscores_pdf
from ... import db
from ...admin_auth import auth_admin

router = APIRouter(prefix="/results/export", tags=["Admin - Export"])

@router.get("/pdf")
async def export_userscores_pdf(
    session: Session = Depends(db.session),
    admin=Depends(auth_admin),
    user_id: int | None = None,
    last_date: bool = Query(..., description="When true, return only rows from the latest created_at."),
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

    try:
        pdf_content = build_userscores_pdf(user_scores, user_name_by_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=userscores_export.pdf"},
    )
