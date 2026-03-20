
import sys
import socket
from fastapi import FastAPI, Request, Response
from .config import settings
from . import db
from . import endpoints


if not db.ping(host=settings.DB_HOST,port=int(settings.DB_PORT)):
    print("ERROR: Database is not reachable.")
    sys.exit(1)
    
db.connect_mysql(user=settings.DB_USER, password=settings.DB_PASSWORD, host=settings.DB_HOST, port=settings.DB_PORT, db_name=settings.DB_NAME, pool_size=settings.DB_POOL_SIZE, max_overflow=settings.DB_POOL_OVERFLOW)
db.init()



app = FastAPI(
    title="Bleeper API", 
    description="API for a simple microblogging app built with FastAPI.",
    version="1.0.0",
)

app.include_router(endpoints.router)

@app.middleware("http")
async def add_served_by_header(request: Request, call_next):
    response: Response = await call_next(request)
    hostname = socket.gethostname()
    response.headers["X-Served-By"] = hostname
    return response




