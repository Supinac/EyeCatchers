from fastapi import APIRouter
from . import admin,user


router = APIRouter(prefix="/admin")


router.include_router(admin.router)
router.include_router(user.router)