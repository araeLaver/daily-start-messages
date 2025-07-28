#!/usr/bin/env python3
"""
기존 데이터베이스 구조를 사용하는 간단한 API
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import hashlib
import json
from typing import Optional, List
import uuid
from datetime import datetime

app = FastAPI(title="모닝 앱 API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 연결 정보
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432
}

# Pydantic 모델들
class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    name: str  # 기존 테이블에서는 name이 username 역할
    password: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: Optional[str]
    active: bool
    created_at: Optional[str]

class FavoriteCreate(BaseModel):
    message_id: str
    message_text: str
    message_author: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True

# 데이터베이스 연결 함수
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# 비밀번호 해시 함수
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# 기본 엔드포인트
@app.get("/")
async def root():
    return {"message": "모닝 앱 API 서버가 실행 중입니다!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        conn.close()
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now()}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now()}

# 사용자 관련 엔드포인트
@app.post("/auth/register")
async def register(user_data: UserCreate):
    """사용자 회원가입 (기존 users 테이블 사용)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 중복 확인
        cur.execute("SELECT user_id FROM users WHERE name = %s;", (user_data.name,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")
        
        if user_data.email:
            cur.execute("SELECT user_id FROM users WHERE email = %s;", (user_data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
        
        # 새 사용자 생성
        user_id = str(uuid.uuid4())
        password_hash = hash_password(user_data.password)
        
        cur.execute("""
            INSERT INTO users (user_id, name, email, password_hash, active, created_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING user_id, name, email, active, created_at;
        """, (user_id, user_data.name, user_data.email, password_hash, True, datetime.now()))
        
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": "회원가입이 완료되었습니다!",
            "user": {
                "user_id": str(user[0]),
                "name": user[1],
                "email": user[2],
                "active": user[3],
                "created_at": user[4].isoformat() if user[4] else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회원가입 중 오류가 발생했습니다: {str(e)}")

@app.post("/auth/login")
async def login(user_data: UserLogin):
    """사용자 로그인"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        password_hash = hash_password(user_data.password)
        
        cur.execute("""
            SELECT user_id, name, email, active, created_at 
            FROM users 
            WHERE name = %s AND password_hash = %s AND active = true;
        """, (user_data.name, password_hash))
        
        user = cur.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="사용자명 또는 비밀번호가 올바르지 않습니다.")
        
        cur.close()
        conn.close()
        
        return {
            "message": "로그인 성공!",
            "user": {
                "user_id": str(user[0]),
                "name": user[1],
                "email": user[2],
                "active": user[3],
                "created_at": user[4].isoformat() if user[4] else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로그인 중 오류가 발생했습니다: {str(e)}")

@app.get("/users")
async def get_users():
    """모든 사용자 조회 (테스트용)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT user_id, name, email, active, created_at 
            FROM users 
            ORDER BY created_at DESC
            LIMIT 10;
        """)
        
        users = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            "users": [
                {
                    "user_id": str(user[0]),
                    "name": user[1],
                    "email": user[2],
                    "active": user[3],
                    "created_at": user[4].isoformat() if user[4] else None
                }
                for user in users
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사용자 조회 중 오류가 발생했습니다: {str(e)}")

# 즐겨찾기 기능 (localStorage 시뮬레이션)
@app.post("/favorites")
async def add_favorite(favorite: FavoriteCreate):
    """즐겨찾기 추가 (단순 응답)"""
    return {
        "message": f"메시지 '{favorite.message_text[:30]}...'가 즐겨찾기에 추가되었습니다!",
        "favorite_id": str(uuid.uuid4()),
        "success": True
    }

@app.get("/favorites")
async def get_favorites():
    """즐겨찾기 조회 (임시 데이터)"""
    return {
        "favorites": [
            {
                "id": str(uuid.uuid4()),
                "message_id": "msg_1",
                "message_text": "새로운 하루가 시작됩니다. 오늘도 좋은 하루 되세요!",
                "message_author": "모닝 팀",
                "added_at": datetime.now().isoformat()
            }
        ]
    }

# 데이터베이스 정보 확인용
@app.get("/db/tables")
async def get_tables():
    """데이터베이스 테이블 정보 조회"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = [table[0] for table in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return {"tables": tables}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테이블 조회 중 오류가 발생했습니다: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("모닝 앱 API 서버 시작...")
    print("API 문서: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)