"""
FastAPI 메인 애플리케이션
모닝 앱 백엔드 API
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

# 로컬 임포트
try:
    from database import get_db, create_tables
except ImportError:
    from database_lite import get_db, create_tables
from models import User, UserFavorite, MessageHistory, JournalEntry, UserGoal, UserMessage, MessageReaction
from schemas import *
from auth import authenticate_user, create_access_token, get_current_active_user, create_user

# FastAPI 앱 생성
app = FastAPI(
    title="모닝 앱 API",
    description="매일 아침 영감을 주는 메시지 앱의 백엔드 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 테이블 생성
@app.on_event("startup")
async def startup_event():
    create_tables()

# 기본 엔드포인트
@app.get("/")
async def root():
    return {"message": "모닝 앱 API 서버가 실행 중입니다!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# === 인증 관련 엔드포인트 ===

@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """사용자 회원가입"""
    try:
        user = create_user(
            db=db,
            username=user_data.username,
            password=user_data.password,
            email=user_data.email,
            display_name=user_data.display_name
        )
        
        # 토큰 생성
        access_token = create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.from_orm(user)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입 중 오류가 발생했습니다."
        )

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """사용자 로그인"""
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다.",
        )
    
    # 마지막 로그인 시간 업데이트
    user.last_login = datetime.now()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """현재 사용자 정보 조회"""
    return UserResponse.from_orm(current_user)

@app.put("/auth/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 업데이트"""
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
    if user_update.email is not None:
        current_user.email = user_update.email
    if user_update.settings is not None:
        current_user.settings = user_update.settings
    
    current_user.updated_at = datetime.now()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)

# === 즐겨찾기 관련 엔드포인트 ===

@app.get("/favorites", response_model=List[FavoriteResponse])
async def get_favorites(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 즐겨찾기 목록 조회"""
    favorites = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    ).order_by(UserFavorite.added_at.desc()).all()
    
    return [FavoriteResponse.from_orm(fav) for fav in favorites]

@app.post("/favorites", response_model=FavoriteResponse)
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """즐겨찾기 추가"""
    # 중복 확인
    existing = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id,
        UserFavorite.message_id == favorite_data.message_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 즐겨찾기에 추가된 메시지입니다."
        )
    
    favorite = UserFavorite(
        user_id=current_user.id,
        message_id=favorite_data.message_id,
        message_data=favorite_data.message_data
    )
    
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return FavoriteResponse.from_orm(favorite)

@app.delete("/favorites/{favorite_id}")
async def remove_favorite(
    favorite_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """즐겨찾기 제거"""
    favorite = db.query(UserFavorite).filter(
        UserFavorite.id == favorite_id,
        UserFavorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="즐겨찾기를 찾을 수 없습니다."
        )
    
    db.delete(favorite)
    db.commit()
    
    return MessageResponse(message="즐겨찾기가 제거되었습니다.")

# === 히스토리 관련 엔드포인트 ===

@app.get("/history", response_model=List[HistoryResponse])
async def get_history(
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 메시지 히스토리 조회"""
    history = db.query(MessageHistory).filter(
        MessageHistory.user_id == current_user.id
    ).order_by(MessageHistory.viewed_at.desc()).limit(limit).all()
    
    return [HistoryResponse.from_orm(item) for item in history]

@app.post("/history", response_model=HistoryResponse)
async def add_history(
    history_data: HistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """히스토리 추가"""
    history = MessageHistory(
        user_id=current_user.id,
        message_id=history_data.message_id,
        message_data=history_data.message_data
    )
    
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return HistoryResponse.from_orm(history)

@app.delete("/history")
async def clear_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """히스토리 전체 삭제"""
    db.query(MessageHistory).filter(
        MessageHistory.user_id == current_user.id
    ).delete()
    db.commit()
    
    return MessageResponse(message="히스토리가 삭제되었습니다.")

# === 일기 관련 엔드포인트 ===

@app.get("/journal", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    limit: int = 30,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """일기 엔트리 목록 조회"""
    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id
    ).order_by(JournalEntry.date.desc()).limit(limit).all()
    
    return [JournalEntryResponse.from_orm(entry) for entry in entries]

@app.get("/journal/{date}", response_model=JournalEntryResponse)
async def get_journal_entry(
    date: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """특정 날짜의 일기 조회"""
    entry = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == date
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 날짜의 일기를 찾을 수 없습니다."
        )
    
    return JournalEntryResponse.from_orm(entry)

@app.post("/journal", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """일기 작성"""
    # 같은 날짜 일기가 있는지 확인
    existing = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == entry_data.date
    ).first()
    
    if existing:
        # 기존 일기 업데이트
        if entry_data.content is not None:
            existing.content = entry_data.content
        if entry_data.mood is not None:
            existing.mood = entry_data.mood
        existing.updated_at = datetime.now()
        
        db.commit()
        db.refresh(existing)
        return JournalEntryResponse.from_orm(existing)
    else:
        # 새 일기 생성
        entry = JournalEntry(
            user_id=current_user.id,
            date=entry_data.date,
            content=entry_data.content,
            mood=entry_data.mood
        )
        
        db.add(entry)
        db.commit()
        db.refresh(entry)
        
        return JournalEntryResponse.from_orm(entry)

@app.put("/journal/{date}", response_model=JournalEntryResponse)
async def update_journal_entry(
    date: str,
    entry_data: JournalEntryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """일기 수정"""
    entry = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == date
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 날짜의 일기를 찾을 수 없습니다."
        )
    
    if entry_data.content is not None:
        entry.content = entry_data.content
    if entry_data.mood is not None:
        entry.mood = entry_data.mood
    entry.updated_at = datetime.now()
    
    db.commit()
    db.refresh(entry)
    
    return JournalEntryResponse.from_orm(entry)

# === 통계 관련 엔드포인트 ===

@app.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """사용자 통계 조회"""
    # 각종 통계 계산
    total_favorites = db.query(UserFavorite).filter(UserFavorite.user_id == current_user.id).count()
    total_history = db.query(MessageHistory).filter(MessageHistory.user_id == current_user.id).count()
    total_journal_entries = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).count()
    total_goals = db.query(UserGoal).filter(UserGoal.user_id == current_user.id).count()
    completed_goals = db.query(UserGoal).filter(
        UserGoal.user_id == current_user.id,
        UserGoal.is_completed == True
    ).count()
    total_user_messages = db.query(UserMessage).filter(UserMessage.user_id == current_user.id).count()
    
    # 연속 방문일 계산 (간단한 버전)
    current_streak = 1  # 임시값
    total_days = total_history  # 임시값
    
    return UserStatsResponse(
        total_favorites=total_favorites,
        total_history=total_history,
        total_journal_entries=total_journal_entries,
        total_goals=total_goals,
        completed_goals=completed_goals,
        total_user_messages=total_user_messages,
        current_streak=current_streak,
        total_days=total_days
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)