"""
Daily Start Messages API
PostgreSQL 데이터베이스 연동 API 서버
"""

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
import logging
from datetime import datetime, time
import random

from database_config import get_db, create_tables, ENVIRONMENT
from models_messages import DailyMessage, MessageHistory, MessageCategory, AdminUser

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Daily Start Messages API",
    description="하루의 시작을 위한 메시지 API",
    version="2.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://daily-start-messages.netlify.app",
        "https://dev-daily-start.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 시작 시 테이블 생성
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행"""
    try:
        create_tables()
        logger.info(f"API server started in {ENVIRONMENT} mode")
    except Exception as e:
        logger.error(f"Startup error: {e}")

def get_current_time_period() -> str:
    """현재 시간대 반환"""
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        return "morning"
    elif 12 <= current_hour < 18:
        return "afternoon" 
    elif 18 <= current_hour < 22:
        return "evening"
    else:
        return "night"

def log_message_access(db: Session, message_id: int, request: Request):
    """메시지 접근 로그 기록"""
    try:
        user_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        history = MessageHistory(
            message_id=message_id,
            user_ip=user_ip,
            user_agent=user_agent
        )
        db.add(history)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log message access: {e}")

# ==================== API 엔드포인트 ====================

@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "message": "Daily Start Messages API",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "status": "running"
    }

@app.get("/api/messages")
async def get_messages(
    request: Request,
    category: Optional[str] = Query(None, description="카테고리 필터"),
    time_of_day: Optional[str] = Query(None, description="시간대 필터"),
    limit: int = Query(10, ge=1, le=100, description="반환할 메시지 수"),
    random_order: bool = Query(True, description="랜덤 순서 여부"),
    db: Session = Depends(get_db)
):
    """메시지 목록 조회"""
    try:
        query = db.query(DailyMessage).filter(DailyMessage.is_active == True)
        
        # 필터링
        if category and category != "all":
            query = query.filter(DailyMessage.category == category)
            
        if time_of_day and time_of_day != "all":
            query = query.filter(
                or_(
                    DailyMessage.time_of_day == time_of_day,
                    DailyMessage.time_of_day == None,
                    DailyMessage.time_of_day == ""
                )
            )
        
        # 정렬
        if random_order:
            query = query.order_by(func.random())
        else:
            query = query.order_by(DailyMessage.priority.desc(), DailyMessage.created_at.desc())
            
        messages = query.limit(limit).all()
        
        return {
            "messages": [msg.to_dict() for msg in messages],
            "total": len(messages),
            "filters": {
                "category": category,
                "timeOfDay": time_of_day,
                "currentTimePeriod": get_current_time_period()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        raise HTTPException(status_code=500, detail="메시지 조회 실패")

@app.get("/api/messages/random")
async def get_random_message(
    request: Request,
    category: Optional[str] = Query(None),
    time_of_day: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """랜덤 메시지 1개 조회"""
    try:
        # 현재 시간대 자동 설정
        if not time_of_day:
            time_of_day = get_current_time_period()
            
        query = db.query(DailyMessage).filter(DailyMessage.is_active == True)
        
        if category and category != "all":
            query = query.filter(DailyMessage.category == category)
            
        if time_of_day and time_of_day != "all":
            query = query.filter(
                or_(
                    DailyMessage.time_of_day == time_of_day,
                    DailyMessage.time_of_day == None,
                    DailyMessage.time_of_day == ""
                )
            )
        
        messages = query.all()
        
        if not messages:
            # 조건에 맞는 메시지가 없으면 전체에서 선택
            messages = db.query(DailyMessage).filter(DailyMessage.is_active == True).all()
            
        if not messages:
            raise HTTPException(status_code=404, detail="메시지를 찾을 수 없습니다")
            
        # 랜덤 선택
        selected_message = random.choice(messages)
        
        # 접근 로그 기록
        log_message_access(db, selected_message.id, request)
        
        return {
            "message": selected_message.to_dict(),
            "metadata": {
                "selectedFrom": len(messages),
                "currentTimePeriod": get_current_time_period(),
                "filters": {
                    "category": category,
                    "timeOfDay": time_of_day
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get random message: {e}")
        raise HTTPException(status_code=500, detail="랜덤 메시지 조회 실패")

@app.get("/api/categories")
async def get_categories(db: Session = Depends(get_db)):
    """카테고리 목록 조회"""
    try:
        # 실제 사용 중인 카테고리들 조회
        used_categories = db.query(
            DailyMessage.category,
            func.count(DailyMessage.id).label('count')
        ).filter(
            DailyMessage.is_active == True
        ).group_by(DailyMessage.category).all()
        
        categories = []
        for cat_name, count in used_categories:
            categories.append({
                "name": cat_name,
                "count": count,
                "displayName": cat_name
            })
            
        # 카테고리를 이름순으로 정렬
        categories.sort(key=lambda x: x['name'])
        
        return {
            "categories": categories,
            "total": len(categories)
        }
        
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="카테고리 조회 실패")

@app.post("/api/messages/{message_id}/reaction")
async def add_reaction(
    message_id: int,
    reaction: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """메시지에 반응 추가"""
    try:
        # 메시지 존재 확인
        message = db.query(DailyMessage).filter(DailyMessage.id == message_id).first()
        if not message:
            raise HTTPException(status_code=404, detail="메시지를 찾을 수 없습니다")
        
        # 반응 유효성 검사
        valid_reactions = ["like", "love", "fire"]
        if reaction not in valid_reactions:
            raise HTTPException(status_code=400, detail="유효하지 않은 반응입니다")
        
        # 히스토리에 반응 기록
        user_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        history = MessageHistory(
            message_id=message_id,
            user_ip=user_ip,
            user_agent=user_agent,
            reaction=reaction
        )
        db.add(history)
        db.commit()
        
        return {"message": "반응이 기록되었습니다", "reaction": reaction}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add reaction: {e}")
        raise HTTPException(status_code=500, detail="반응 추가 실패")

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """통계 정보 조회"""
    try:
        total_messages = db.query(func.count(DailyMessage.id)).filter(
            DailyMessage.is_active == True
        ).scalar()
        
        total_views = db.query(func.count(MessageHistory.id)).scalar()
        
        # 오늘의 접근 수
        today = datetime.now().date()
        today_views = db.query(func.count(MessageHistory.id)).filter(
            func.date(MessageHistory.accessed_at) == today
        ).scalar()
        
        # 인기 카테고리 (상위 5개)
        popular_categories = db.query(
            DailyMessage.category,
            func.count(MessageHistory.id).label('views')
        ).join(
            MessageHistory, DailyMessage.id == MessageHistory.message_id
        ).group_by(DailyMessage.category).order_by(
            func.count(MessageHistory.id).desc()
        ).limit(5).all()
        
        return {
            "totalMessages": total_messages,
            "totalViews": total_views,
            "todayViews": today_views,
            "popularCategories": [
                {"category": cat, "views": views} 
                for cat, views in popular_categories
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="통계 조회 실패")

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_messages:app",
        host="0.0.0.0",
        port=8000,
        reload=True if ENVIRONMENT == "development" else False
    )