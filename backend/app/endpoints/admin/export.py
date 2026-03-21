from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ... import tables, db
from ...admin_auth import auth_admin
from ...report import record_to_html, records_to_html, records_to_csv


router = APIRouter(prefix="/results/export", tags=["Admin - Export"])


def _score_to_dict(score: tables.UserScore, user_name: str = "?") -> dict:
    return {
        "id": score.id,
        "user_id": score.user_id,
        "user_name": user_name,
        "game_type": score.game_type.value if hasattr(score.game_type, "value") else str(score.game_type),
        "settings": score.settings or {},
        "results": score.results or {},
        "created_at": score.created_at,
    }


def _resolve_user_name(session: Session, user_id: int) -> str:
    user = session.execute(
        select(tables.User).where(tables.User.id == user_id)
    ).scalar_one_or_none()
    return user.name if user else f"#{user_id}"


# ── Single result ───────────────────────────────────────────────

@router.get("/{result_id}/html", status_code=200)
def export_result_html(
    result_id: int,
    session: Session = Depends(db.session),
    current_admin: tables.Admin = Depends(auth_admin),
):
    score = session.execute(
        select(tables.UserScore).where(tables.UserScore.id == result_id)
    ).scalar_one_or_none()

    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    user_name = _resolve_user_name(session, score.user_id)
    game_type = score.game_type.value if hasattr(score.game_type, "value") else str(score.game_type)

    html = record_to_html(
        record_id=score.id,
        user_id=score.user_id,
        user_name=user_name,
        game_type=game_type,
        settings=score.settings or {},
        results=score.results or {},
        created_at=score.created_at,
    )

    return Response(
        content=html,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="result_{result_id}.html"'},
    )


@router.get("/{result_id}/csv", status_code=200)
def export_result_csv(
    result_id: int,
    session: Session = Depends(db.session),
    current_admin: tables.Admin = Depends(auth_admin),
):
    score = session.execute(
        select(tables.UserScore).where(tables.UserScore.id == result_id)
    ).scalar_one_or_none()

    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    user_name = _resolve_user_name(session, score.user_id)
    data = [_score_to_dict(score, user_name)]
    csv_content = records_to_csv(data)

    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="result_{result_id}.csv"'},
    )


# ── Bulk export (all or filtered by user) ───────────────────────

@router.get("/all/html", status_code=200)
def export_all_html(
    user_id: int | None = Query(default=None, description="Filter by user ID"),
    session: Session = Depends(db.session),
    current_admin: tables.Admin = Depends(auth_admin),
):
    query = select(tables.UserScore)
    if user_id is not None:
        query = query.where(tables.UserScore.user_id == user_id)

    scores = session.execute(query).scalars().all()

    if not scores:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No results found")

    # Build user name cache
    user_ids = {s.user_id for s in scores}
    users = session.execute(select(tables.User).where(tables.User.id.in_(user_ids))).scalars().all()
    name_map = {u.id: u.name for u in users}

    records = [_score_to_dict(s, name_map.get(s.user_id, f"#{s.user_id}")) for s in scores]
    html = records_to_html(records)

    filename = f"results_user_{user_id}.html" if user_id else "results_all.html"
    return Response(
        content=html,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/all/csv", status_code=200)
def export_all_csv(
    user_id: int | None = Query(default=None, description="Filter by user ID"),
    session: Session = Depends(db.session),
    current_admin: tables.Admin = Depends(auth_admin),
):
    query = select(tables.UserScore)
    if user_id is not None:
        query = query.where(tables.UserScore.user_id == user_id)

    scores = session.execute(query).scalars().all()

    if not scores:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No results found")

    user_ids = {s.user_id for s in scores}
    users = session.execute(select(tables.User).where(tables.User.id.in_(user_ids))).scalars().all()
    name_map = {u.id: u.name for u in users}

    records = [_score_to_dict(s, name_map.get(s.user_id, f"#{s.user_id}")) for s in scores]
    csv_content = records_to_csv(records)

    filename = f"results_user_{user_id}.csv" if user_id else "results_all.csv"
    return Response(
        content=csv_content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
