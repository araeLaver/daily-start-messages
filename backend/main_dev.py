#!/usr/bin/env python3
"""
모닝 앱 개발환경 API 서버
morning_dev 스키마 사용
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
import psycopg2
import psycopg2.extras
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
import uuid
import os

# JWT 설정
SECRET_KEY = "dev_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI(
    title="모닝 앱 API (개발환경)",
    description="개발환경용 모닝 앱 백엔드 API - morning_dev 스키마 사용",
    version="1.0.0-dev"
)

# CORS 설정 (개발환경)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 설정
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432,
    'options': '-c search_path=morning_dev'  # 스키마 지정
}

security = HTTPBearer()

# Pydantic 모델들
class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    display_name: Optional[str] = None
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError('사용자명은 3-50자 사이여야 합니다.')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('비밀번호는 최소 6자 이상이어야 합니다.')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str]
    display_name: Optional[str]
    is_active: bool
    created_at: datetime
    settings: Dict[str, Any] = {}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FavoriteCreate(BaseModel):
    message_id: str
    message_data: Dict[str, Any]

class FavoriteResponse(BaseModel):
    id: str
    message_id: str
    message_data: Dict[str, Any]
    added_at: datetime

class JournalCreate(BaseModel):
    date: str  # YYYY-MM-DD
    content: Optional[str] = None
    mood: Optional[str] = None
    weather: Optional[str] = None
    tags: Optional[List[str]] = []

class JournalResponse(BaseModel):
    id: str
    date: str
    content: Optional[str]
    mood: Optional[str]
    weather: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    goal_type: str
    target_count: int = 1
    target_date: Optional[str] = None  # YYYY-MM-DD

class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    goal_type: str
    target_count: int
    current_count: int
    is_completed: bool
    start_date: str
    target_date: Optional[str]
    created_at: datetime

# 유틸리티 함수들
def get_db_connection():
    """데이터베이스 연결"""
    return psycopg2.connect(**DB_CONFIG)

def hash_password(password: str) -> str:
    """비밀번호 해시화"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    """JWT 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except jwt.PyJWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 사용자 가져오기"""
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 사용자 조회
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE username = %s AND is_active = true;", (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return dict(user)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error")

# API 엔드포인트들
@app.get("/")
async def root():
    return {
        "message": "모닝 앱 개발환경 API 서버",
        "version": "1.0.0-dev",
        "schema": "morning_dev",
        "environment": "development"
    }

@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        conn.close()
        return {
            "status": "healthy",
            "database": "connected",
            "schema": "morning_dev",
            "timestamp": datetime.now()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        }

@app.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """사용자 회원가입"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 중복 확인
        cur.execute("SELECT id FROM users WHERE username = %s;", (user_data.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")
        
        if user_data.email:
            cur.execute("SELECT id FROM users WHERE email = %s;", (user_data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
        
        # 새 사용자 생성
        password_hash = hash_password(user_data.password)
        cur.execute("""
            INSERT INTO users (username, email, password_hash, display_name, is_active) 
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *;
        """, (
            user_data.username,
            user_data.email,
            password_hash,
            user_data.display_name or user_data.username,
            True
        ))
        
        user = dict(cur.fetchone())
        conn.commit()
        
        # JWT 토큰 생성
        access_token = create_access_token(data={"sub": user["username"]})
        
        cur.close()
        conn.close()
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(**user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회원가입 중 오류가 발생했습니다: {str(e)}")

@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """사용자 로그인"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        password_hash = hash_password(user_data.password)
        cur.execute("""
            SELECT * FROM users 
            WHERE username = %s AND password_hash = %s AND is_active = true;
        """, (user_data.username, password_hash))
        
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="사용자명 또는 비밀번호가 올바르지 않습니다.")
        
        user = dict(user)
        
        # 마지막 로그인 시간 업데이트
        cur.execute("UPDATE users SET last_login = %s WHERE id = %s;", (datetime.now(), user["id"]))
        conn.commit()
        
        # JWT 토큰 생성
        access_token = create_access_token(data={"sub": user["username"]})
        
        cur.close()
        conn.close()
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(**user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로그인 중 오류가 발생했습니다: {str(e)}")

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return UserResponse(**current_user)

@app.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """즐겨찾기 목록 조회"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT * FROM user_favorites 
            WHERE user_id = %s 
            ORDER BY added_at DESC;
        """, (current_user["id"],))
        
        favorites = [dict(fav) for fav in cur.fetchall()]
        cur.close()
        conn.close()
        
        return [FavoriteResponse(**fav) for fav in favorites]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"즐겨찾기 조회 중 오류: {str(e)}")

@app.post("/favorites", response_model=FavoriteResponse)
async def add_favorite(favorite_data: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    """즐겨찾기 추가"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 중복 확인
        cur.execute("""
            SELECT id FROM user_favorites 
            WHERE user_id = %s AND message_id = %s;
        """, (current_user["id"], favorite_data.message_id))
        
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="이미 즐겨찾기에 추가된 메시지입니다.")
        
        # 즐겨찾기 추가
        cur.execute("""
            INSERT INTO user_favorites (user_id, message_id, message_data) 
            VALUES (%s, %s, %s)
            RETURNING *;
        """, (current_user["id"], favorite_data.message_id, psycopg2.extras.Json(favorite_data.message_data)))
        
        favorite = dict(cur.fetchone())
        conn.commit()
        cur.close()
        conn.close()
        
        return FavoriteResponse(**favorite)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"즐겨찾기 추가 중 오류: {str(e)}")

@app.delete("/favorites/{favorite_id}")
async def remove_favorite(favorite_id: str, current_user: dict = Depends(get_current_user)):
    """즐겨찾기 제거"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            DELETE FROM user_favorites 
            WHERE id = %s AND user_id = %s;
        """, (favorite_id, current_user["id"]))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="즐겨찾기를 찾을 수 없습니다.")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "즐겨찾기가 제거되었습니다.", "success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"즐겨찾기 제거 중 오류: {str(e)}")

# 개발환경 전용 엔드포인트
@app.get("/dev/users")
async def get_all_users():
    """모든 사용자 조회 (개발환경 전용)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT * FROM users ORDER BY created_at DESC LIMIT 10;")
        users = [dict(user) for user in cur.fetchall()]
        cur.close()
        conn.close()
        
        return {"users": users}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사용자 조회 중 오류: {str(e)}")

@app.get("/dev/tables")
async def get_tables():
    """morning_dev 스키마 테이블 정보 (개발환경 전용)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'morning_dev'
            ORDER BY table_name;
        """)
        
        tables = [table[0] for table in cur.fetchall()]
        cur.close()
        conn.close()
        
        return {"schema": "morning_dev", "tables": tables}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테이블 조회 중 오류: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("=== 모닝 앱 개발환경 API 서버 시작 ===")
    print("스키마: morning_dev")
    print("포트: 8002")
    print("API 문서: http://localhost:8002/docs")
    print("건강 상태: http://localhost:8002/health")
    uvicorn.run(app, host="0.0.0.0", port=8002)