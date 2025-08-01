"""
메시지 관련 데이터베이스 모델
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base 
from sqlalchemy.sql import func
from database_config import Base, get_schema
from datetime import datetime

class DailyMessage(Base):
    """일일 메시지 모델"""
    __tablename__ = "daily_messages"
    __table_args__ = {"schema": get_schema()}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(Text, nullable=False, comment="메시지 내용")
    author = Column(String(100), nullable=False, comment="작성자/인용구 출처")
    category = Column(String(50), nullable=False, comment="메시지 카테고리")
    time_of_day = Column(String(20), nullable=True, comment="시간대: morning, afternoon, evening, night")
    season = Column(String(20), default="all", comment="계절: spring, summer, autumn, winter, all")
    
    # 메타데이터
    is_active = Column(Boolean, default=True, comment="활성화 상태")
    priority = Column(Integer, default=1, comment="우선순위 (1-10)")
    tags = Column(String(200), nullable=True, comment="태그 (쉼표로 구분)")
    
    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="수정일시")
    created_by = Column(String(50), default="system", comment="생성자")
    
    def __repr__(self):
        return f"<DailyMessage(id={self.id}, author='{self.author}', category='{self.category}')>"
    
    def to_dict(self):
        """딕셔너리로 변환"""
        return {
            "id": self.id,
            "text": self.text,
            "author": self.author,
            "category": self.category,
            "timeOfDay": self.time_of_day,
            "season": self.season,
            "isActive": self.is_active,
            "priority": self.priority,
            "tags": self.tags.split(",") if self.tags else [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "createdBy": self.created_by
        }

class MessageHistory(Base):
    """메시지 사용 히스토리"""
    __tablename__ = "message_history"
    __table_args__ = {"schema": get_schema()}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, nullable=False, comment="메시지 ID")
    user_ip = Column(String(45), nullable=True, comment="사용자 IP")
    user_agent = Column(String(500), nullable=True, comment="사용자 에이전트")
    accessed_at = Column(DateTime(timezone=True), server_default=func.now(), comment="접근일시")
    reaction = Column(String(20), nullable=True, comment="사용자 반응: like, love, fire")
    
    def __repr__(self):
        return f"<MessageHistory(id={self.id}, message_id={self.message_id})>"

class MessageCategory(Base):
    """메시지 카테고리 관리"""
    __tablename__ = "message_categories"
    __table_args__ = {"schema": get_schema()}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, comment="카테고리 이름")
    description = Column(String(200), nullable=True, comment="카테고리 설명")
    color = Column(String(7), default="#666666", comment="카테고리 색상 (HEX)")
    icon = Column(String(50), nullable=True, comment="카테고리 아이콘")
    sort_order = Column(Integer, default=0, comment="정렬 순서")
    is_active = Column(Boolean, default=True, comment="활성화 상태")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<MessageCategory(name='{self.name}')>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "sortOrder": self.sort_order,
            "isActive": self.is_active
        }

class AdminUser(Base):
    """관리자 사용자"""
    __tablename__ = "admin_users"
    __table_args__ = {"schema": get_schema()}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AdminUser(username='{self.username}')>"