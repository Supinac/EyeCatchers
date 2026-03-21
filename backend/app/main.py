
import sys
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request, Response
from .config import settings
from . import db
from .endpoints.admin import router as admin_router
from .endpoints.user import router as user_router




if settings.DB_TYPE != "sqlite" :
    if not db.ping(host=settings.DB_HOST, port=int(settings.DB_PORT)):
        print("ERROR: Database is not reachable.")
        sys.exit(1)

match settings.DB_TYPE:
    case "mysql":

        db.connect_mysql(
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            db_name=settings.DB_NAME,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_POOL_OVERFLOW,
        )

    case "sqlite":
        db.connect_sqlite(db_name=settings.DB_NAME)

db.init()


app = FastAPI(
    title="EyeCatchers API",
    description="API for the EyeCatchers app.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(admin_router.router)
app.include_router(user_router.router)
