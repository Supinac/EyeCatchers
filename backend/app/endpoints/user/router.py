from fastapi import APIRouter

from . import login, results


router = APIRouter(prefix="/user")


router.include_router(results.router)
router.include_router(login.router)