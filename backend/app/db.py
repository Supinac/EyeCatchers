from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass, sessionmaker
import socket


class Base(DeclarativeBase, MappedAsDataclass, kw_only=True):
    pass

def ping(host: str, port: int, timeout: int = 5):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        return False
    

def connect_mysql(user, password, host, port, db_name, pool_size=100, max_overflow=100):
    global engine
    
    DB_URL = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{db_name}"
    engine = create_engine(
        DB_URL,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_recycle=3600,
        pool_pre_ping=True,
        )       
        
def init():
    # Import models to ensure they are registered with Base.metadata
    from . import models
    Base.metadata.create_all(engine, checkfirst=True)
    
    
def session():
    global engine
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    with SessionLocal() as session:
        yield session