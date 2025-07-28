"""
데이터베이스 모델 정의
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
try:
    from database import Base
except ImportError:
    from database_lite import Base
import uuid

class User(Base):
    """사용자 모델"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # 사용자 설정 (JSON 형태로 저장)
    settings = Column(JSON, default={})
    
    # 관계 설정
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")
    history = relationship("MessageHistory", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("UserGoal", back_populates="user", cascade="all, delete-orphan")
    user_messages = relationship("UserMessage", back_populates="user", cascade="all, delete-orphan")

class UserFavorite(Base):
    """사용자 즐겨찾기 모델"""
    __tablename__ = "user_favorites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message_id = Column(String, nullable=False)  # 메시지 JSON의 ID
    message_data = Column(JSON, nullable=False)  # 메시지 전체 데이터
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="favorites")

class MessageHistory(Base):
    """메시지 조회 히스토리 모델"""
    __tablename__ = "message_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message_id = Column(String, nullable=False)
    message_data = Column(JSON, nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="history")

class JournalEntry(Base):
    """일기 엔트리 모델"""
    __tablename__ = "journal_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD 형식
    content = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)  # great, good, okay, bad, terrible
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="journal_entries")

class UserGoal(Base):
    """사용자 목표 모델"""
    __tablename__ = "user_goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # health, study, work, relationship, hobby, other
    goal_type = Column(String(20), nullable=False)  # weekly, monthly
    target_count = Column(Integer, default=1)
    current_count = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    target_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="goals")

class UserMessage(Base):
    """사용자가 제출한 메시지 모델"""
    __tablename__ = "user_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    author = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False)
    time_of_day = Column(String(20), nullable=True)  # morning, afternoon, evening, night
    season = Column(String(20), default="all")  # spring, summer, autumn, winter, all
    is_approved = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="user_messages")

class MessageReaction(Base):
    """메시지 반응 모델"""
    __tablename__ = "message_reactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message_id = Column(String, nullable=False)  # 메시지 JSON의 ID 또는 UserMessage의 ID
    reaction_type = Column(String(20), nullable=False)  # like, heart, fire
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 유니크 제약 조건: 한 사용자는 한 메시지에 한 번만 같은 반응 가능
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )

class UserSession(Base):
    """사용자 세션 모델 (선택적)"""
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # 관계 설정
    user = relationship("User")