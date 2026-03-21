from fastapi import APIRouter

from . import admin, user, login, results, export


router = APIRouter(prefix="/admin")


router.include_router(admin.router)
router.include_router(user.router)
router.include_router(login.router)
router.include_router(results.router)
router.include_router(export.router)
