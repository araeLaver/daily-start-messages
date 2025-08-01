"""
PostgreSQL 데이터베이스 설정 및 연결 관리
개발/운영 환경 분리 지원
"""

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# 환경변수 또는 기본값 설정
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development, production

# 데이터베이스 연결 설정
DATABASE_CONFIG = {
    "development": {
        "ENGINE": "postgresql",
        "NAME": "untab_dev",
        "USER": "untab",
        "PASSWORD": "0AbVNOIsl2dn",
        "HOST": "ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app",
        "PORT": "5432",
        "OPTIONS": {"sslmode": "require"},
        "SCHEMA": "development"
    },
    "production": {
        "ENGINE": "postgresql", 
        "NAME": "untab",
        "USER": "untab",
        "PASSWORD": "0AbVNOIsl2dn",
        "HOST": "ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app",
        "PORT": "5432",
        "OPTIONS": {"sslmode": "require"},
        "SCHEMA": "production"
    }
}

def get_database_url(environment: str = None) -> str:
    """환경에 따른 데이터베이스 URL 생성"""
    env = environment or ENVIRONMENT
    config = DATABASE_CONFIG[env]
    
    return (
        f"postgresql://{config['USER']}:{config['PASSWORD']}"
        f"@{config['HOST']}:{config['PORT']}/{config['NAME']}"
        f"?sslmode={config['OPTIONS']['sslmode']}"
    )

# SQLAlchemy 엔진 및 세션 생성
engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,
    pool_recycle=300,
    echo=True if ENVIRONMENT == "development" else False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 메타데이터에 스키마 설정
def get_schema() -> str:
    """현재 환경의 스키마 반환"""
    return DATABASE_CONFIG[ENVIRONMENT]["SCHEMA"]

# 데이터베이스 세션 의존성
def get_db() -> Generator:
    """FastAPI 의존성: 데이터베이스 세션 제공"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 테이블 생성 함수
def create_tables():
    """데이터베이스 테이블 생성"""
    # 스키마 먼저 생성
    schema = get_schema()
    with engine.connect() as conn:
        conn.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
        conn.commit()
    
    # 테이블 생성
    Base.metadata.create_all(bind=engine)
    print(f"Tables created in schema: {schema}")

if __name__ == "__main__":
    print(f"Current environment: {ENVIRONMENT}")
    print(f"Database URL: {get_database_url()}")
    print(f"Schema: {get_schema()}")