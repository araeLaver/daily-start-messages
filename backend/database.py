"""
데이터베이스 연결 및 설정
"""

from sqlalchemy import URL, create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

# 데이터베이스 연결 설정
connection_string = URL.create(
    'postgresql',
    username='untab',
    password='0AbVNOIsl2dn',
    host='ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    database='untab',
)

# SQLAlchemy 엔진 생성
engine = create_engine(
    connection_string,
    pool_pre_ping=True,  # 연결 상태 확인
    pool_recycle=300,    # 5분마다 연결 재생성
    echo=False           # SQL 로그 (개발 시에는 True로 설정 가능)
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 생성
Base = declarative_base()

# 메타데이터 설정
metadata = MetaData()

def get_db():
    """
    데이터베이스 세션 의존성
    FastAPI에서 사용할 데이터베이스 세션을 제공합니다.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    모든 테이블 생성
    """
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """
    모든 테이블 삭제 (개발용)
    """
    Base.metadata.drop_all(bind=engine)