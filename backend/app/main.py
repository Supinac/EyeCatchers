
import sys
import socket
from fastapi import FastAPI, Request, Response
from .config import settings
from . import db
from .endpoints.admin import router as admin_router


# if not db.ping(host=settings.DB_HOST, port=int(settings.DB_PORT)):
#     print("ERROR: Database is not reachable.")
#     sys.exit(1)

# db.connect_mysql(
#     user=settings.DB_USER,
#     password=settings.DB_PASSWORD,
#     host=settings.DB_HOST,
#     port=settings.DB_PORT,
#     db_name=settings.DB_NAME,
#     pool_size=settings.DB_POOL_SIZE,
#     max_overflow=settings.DB_POOL_OVERFLOW,
# )
db.connect_sqlite(db_name="test.db")
db.init()


app = FastAPI(
    title="EyeCatchers API",
    description="API for the EyeCatchers app.",
    version="1.0.0",
)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# app.include_router(user.router)
app.include_router(admin_router.router)
