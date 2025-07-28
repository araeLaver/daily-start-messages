"""
기존 데이터베이스 구조에 맞는 모델 정의
"""

from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid

try:
    from database import Base
except ImportError:
    from database_lite import Base

class User(Base):
    """기존 사용자 모델 (기존 테이블 구조에 맞춤)"""
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)  # username 대신 name 사용
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=True, default=func.now())
    updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

class Company(Base):
    """기존 회사 모델"""
    __tablename__ = "company"
    
    company_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    website_url = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True, default=func.now())
    updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

class JobPosting(Base):
    """기존 채용공고 모델"""
    __tablename__ = "job_posting"
    
    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.company_id"), nullable=True)
    position = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    salary_min = Column(Numeric, nullable=True)
    salary_max = Column(Numeric, nullable=True)
    deadline = Column(DateTime, nullable=True)
    job_url = Column(String, nullable=True)
    source_site = Column(String, nullable=True)
    status = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True, default=func.now())
    updated_at = Column(DateTime, nullable=True, default=func.now(), onupdate=func.now())

# 모닝 앱용 새 테이블들 (기존 DB에 추가할 수 있다면)
class UserFavorite(Base):
    """사용자 즐겨찾기 모델 (새로 생성 시도)"""
    __tablename__ = "morning_favorites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    message_id = Column(String, nullable=False)
    message_data = Column(JSON, nullable=False)
    added_at = Column(DateTime, nullable=False, default=func.now())

class MessageHistory(Base):
    """메시지 히스토리 모델 (새로 생성 시도)"""
    __tablename__ = "morning_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    message_id = Column(String, nullable=False)
    message_data = Column(JSON, nullable=False)
    viewed_at = Column(DateTime, nullable=False, default=func.now())

class JournalEntry(Base):
    """일기 엔트리 모델 (새로 생성 시도)"""
    __tablename__ = "morning_journal"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD 형식
    content = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())