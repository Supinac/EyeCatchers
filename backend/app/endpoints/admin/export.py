from datetime import datetime, timedelta

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
    last_date: bool = Query(False, description="When true, return only rows from the latest created_at."),
):
    filters = []
    if user_id is not None:
        filters.append(tables.UserScore.user_id == user_id)

    stmt = select(tables.UserScore).where(*filters)

    # If requested, keep only rows from the latest activity day in the filtered set.
    if last_date:
        latest_stmt = select(func.max(tables.UserScore.created_at)).where(*filters)

        latest_created_at = session.execute(latest_stmt).scalar_one_or_none()
        if latest_created_at is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user scores found")

        if isinstance(latest_created_at, datetime):
            day_start = latest_created_at.replace(hour=0, minute=0, second=0, microsecond=0)
            next_day_start = day_start + timedelta(days=1)
            stmt = stmt.where(
                tables.UserScore.created_at >= day_start,
                tables.UserScore.created_at < next_day_start,
            )
        else:
            # Fallback for non-datetime DB types.
            stmt = stmt.where(func.date(tables.UserScore.created_at) == func.date(latest_created_at))

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
