from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from . import db
from .models import Post, PostCreate


router = APIRouter(prefix="/posts", tags=["posts"])

@router.get("", status_code=200, responses={})
def get_posts(skip: int = 0, limit: int = 10, session: Session = Depends(db.session)):
    
    db_results = session.execute(
        select(Post)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()
    
    return db_results


@router.post("", status_code=201, responses={})
def create_post(request: PostCreate, session: Session = Depends(db.session)):
    
    post = Post(**request.model_dump())

    session.add(post)
    session.commit()
    session.refresh(post)
    return post

