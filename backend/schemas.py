"""
Pydantic 스키마 정의
API 요청/응답 데이터 검증용
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

# 사용자 관련 스키마
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError('사용자명은 3-20자 사이여야 합니다.')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('사용자명은 영문, 숫자, 언더스코어만 가능합니다.')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('비밀번호는 최소 6자 이상이어야 합니다.')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    settings: Optional[Dict[str, Any]] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    settings: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True

# 인증 관련 스키마
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# 즐겨찾기 관련 스키마
class FavoriteCreate(BaseModel):
    message_id: str
    message_data: Dict[str, Any]

class FavoriteResponse(BaseModel):
    id: str
    message_id: str
    message_data: Dict[str, Any]
    added_at: datetime
    
    class Config:
        from_attributes = True

# 히스토리 관련 스키마
class HistoryCreate(BaseModel):
    message_id: str
    message_data: Dict[str, Any]

class HistoryResponse(BaseModel):
    id: str
    message_id: str
    message_data: Dict[str, Any]
    viewed_at: datetime
    
    class Config:
        from_attributes = True

# 일기 관련 스키마
class JournalEntryCreate(BaseModel):
    date: str  # YYYY-MM-DD
    content: Optional[str] = None
    mood: Optional[str] = None
    
    @validator('date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('날짜는 YYYY-MM-DD 형식이어야 합니다.')
    
    @validator('mood')
    def validate_mood(cls, v):
        if v and v not in ['great', 'good', 'okay', 'bad', 'terrible']:
            raise ValueError('올바른 기분 값이 아닙니다.')
        return v

class JournalEntryUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    
    @validator('mood')
    def validate_mood(cls, v):
        if v and v not in ['great', 'good', 'okay', 'bad', 'terrible']:
            raise ValueError('올바른 기분 값이 아닙니다.')
        return v

class JournalEntryResponse(BaseModel):
    id: str
    date: str
    content: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 목표 관련 스키마
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    goal_type: str
    target_count: int = 1
    target_date: Optional[datetime] = None
    
    @validator('category')
    def validate_category(cls, v):
        valid_categories = ['health', 'study', 'work', 'relationship', 'hobby', 'other']
        if v not in valid_categories:
            raise ValueError('올바른 카테고리가 아닙니다.')
        return v
    
    @validator('goal_type')
    def validate_goal_type(cls, v):
        if v not in ['weekly', 'monthly']:
            raise ValueError('목표 타입은 weekly 또는 monthly여야 합니다.')
        return v

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    current_count: Optional[int] = None
    is_completed: Optional[bool] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    goal_type: str
    target_count: int
    current_count: int
    is_completed: bool
    start_date: datetime
    target_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 사용자 메시지 관련 스키마
class UserMessageCreate(BaseModel):
    text: str
    author: Optional[str] = None
    category: str
    time_of_day: Optional[str] = None
    season: str = "all"
    
    @validator('text')
    def validate_text(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('메시지는 최소 10자 이상이어야 합니다.')
        if len(v) > 500:
            raise ValueError('메시지는 최대 500자까지 가능합니다.')
        return v.strip()
    
    @validator('time_of_day')
    def validate_time_of_day(cls, v):
        if v and v not in ['morning', 'afternoon', 'evening', 'night']:
            raise ValueError('올바른 시간대가 아닙니다.')
        return v
    
    @validator('season')
    def validate_season(cls, v):
        if v not in ['spring', 'summer', 'autumn', 'winter', 'all']:
            raise ValueError('올바른 계절이 아닙니다.')
        return v

class UserMessageResponse(BaseModel):
    id: str
    text: str
    author: Optional[str] = None
    category: str
    time_of_day: Optional[str] = None
    season: str
    is_approved: bool
    is_public: bool
    like_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 반응 관련 스키마
class ReactionCreate(BaseModel):
    message_id: str
    reaction_type: str
    
    @validator('reaction_type')
    def validate_reaction_type(cls, v):
        if v not in ['like', 'heart', 'fire']:
            raise ValueError('올바른 반응 타입이 아닙니다.')
        return v

class ReactionResponse(BaseModel):
    id: str
    message_id: str
    reaction_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# 통계 관련 스키마
class UserStatsResponse(BaseModel):
    total_favorites: int
    total_history: int
    total_journal_entries: int
    total_goals: int
    completed_goals: int
    total_user_messages: int
    current_streak: int
    total_days: int

# 일반 응답 스키마
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    success: bool = False