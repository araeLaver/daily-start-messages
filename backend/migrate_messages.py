"""
messages.json 데이터를 PostgreSQL로 마이그레이션
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from database_config import SessionLocal, create_tables, ENVIRONMENT
from models_messages import DailyMessage, MessageCategory

def load_json_messages(json_file_path: str) -> list:
    """JSON 파일에서 메시지 데이터 로드"""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data.get('messages', [])
    except FileNotFoundError:
        print(f"Error: {json_file_path} 파일을 찾을 수 없습니다.")
        return []
    except json.JSONDecodeError as e:
        print(f"Error: JSON 파싱 실패 - {e}")
        return []

def create_categories_from_messages(db: Session, messages: list):
    """메시지에서 카테고리 추출하여 생성"""
    categories = set()
    for message in messages:
        if message.get('category'):
            categories.add(message['category'])
    
    # 카테고리별 색상 매핑
    category_colors = {
        "자기계발": "#4CAF50",
        "성공": "#FF9800", 
        "동기부여": "#2196F3",
        "목표": "#9C27B0",
        "현재에 집중": "#00BCD4",
        "믿음": "#3F51B5",
        "변화": "#FF5722",
        "가능성": "#795548",
        "행복": "#FFEB3B",
        "인내": "#607D8B",
        "자신감": "#E91E63",
        "긍정적 사고": "#8BC34A",
        "혁신": "#FF6F00",
        "꿈": "#673AB7",
        "진보": "#009688",
        "가치": "#FFC107",
        "도전": "#F44336",
        "학습": "#03DAC6",
        "시간 관리": "#6200EE",
        "완벽주의": "#018786",
        "성취": "#B00020",
        "기회": "#3700B3", 
        "실패": "#CF6679",
        "열정": "#BB86FC",
        "미래": "#03DAC5",
        "행동": "#FF0266",
        "삶의 지혜": "#6200EA",
        "용기": "#00C853",
        "위험감수": "#FF5252",
        "끈기": "#448AFF",
        "습관": "#69F0AE",
        "감사": "#FFD740",
        "잠재력": "#FF4081",
        "응원": "#40C4FF",
        "노력": "#B39DDB",
        "성장": "#A5D6A7",
        "새로운 시작": "#FFCC02"
    }
    
    category_icons = {
        "자기계발": "🚀",
        "성공": "🏆", 
        "동기부여": "💪",
        "목표": "🎯",
        "현재에 집중": "⭐",
        "믿음": "🙏",
        "변화": "🔄",
        "가능성": "✨",
        "행복": "😊",
        "인내": "⏳",
        "자신감": "💎",
        "긍정적 사고": "☀️",
        "혁신": "💡",
        "꿈": "🌟",
        "진보": "📈",
        "가치": "💰",
        "도전": "⛰️",
        "학습": "📚",
        "시간 관리": "⏰",
        "완벽주의": "🎨",
        "성취": "🏅",
        "기회": "🚪",
        "실패": "📝",
        "열정": "🔥",
        "미래": "🔮",
        "행동": "🏃",
        "삶의 지혜": "🧠",
        "용기": "🦁",
        "위험감수": "🎲",
        "끈기": "🏋️",
        "습관": "📅",
        "감사": "🙏",
        "잠재력": "🌱",
        "응원": "👏",
        "노력": "💪",
        "성장": "🌳",
        "새로운 시작": "🌅"
    }
    
    for i, category_name in enumerate(sorted(categories)):
        existing_category = db.query(MessageCategory).filter(
            MessageCategory.name == category_name
        ).first()
        
        if not existing_category:
            category = MessageCategory(
                name=category_name,
                description=f"{category_name} 관련 메시지",
                color=category_colors.get(category_name, "#666666"),
                icon=category_icons.get(category_name, "💫"),
                sort_order=i + 1
            )
            db.add(category)
    
    db.commit()
    print(f"Created {len(categories)} categories")

def migrate_messages_to_db(db: Session, messages: list):
    """메시지를 데이터베이스로 마이그레이션"""
    migrated_count = 0
    skipped_count = 0
    
    for message_data in messages:
        try:
            # 중복 체크 (텍스트 기준)
            existing_message = db.query(DailyMessage).filter(
                DailyMessage.text == message_data['text']
            ).first()
            
            if existing_message:
                print(f"Skipped duplicate: {message_data['text'][:50]}...")
                skipped_count += 1
                continue
            
            # 새 메시지 생성
            new_message = DailyMessage(
                text=message_data['text'],
                author=message_data.get('author', '익명'),
                category=message_data.get('category', '기타'),
                time_of_day=message_data.get('timeOfDay', ''),
                season=message_data.get('season', 'all'),
                is_active=True,
                priority=5,  # 기본 우선순위
                created_by="migration_script"
            )
            
            db.add(new_message)
            migrated_count += 1
            
        except Exception as e:
            print(f"Error migrating message: {e}")
            print(f"Message data: {message_data}")
            continue
    
    db.commit()
    return migrated_count, skipped_count

def main():
    """메인 마이그레이션 함수"""
    print(f"Starting migration in {ENVIRONMENT} environment...")
    
    # messages.json 파일 경로
    json_file_path = Path(__file__).parent.parent / "messages.json"
    
    if not json_file_path.exists():
        print(f"Error: {json_file_path} 파일이 존재하지 않습니다.")
        sys.exit(1)
    
    # 데이터베이스 테이블 생성
    print("Creating database tables...")
    create_tables()
    
    # JSON 데이터 로드
    print("Loading messages from JSON...")
    messages = load_json_messages(str(json_file_path))
    
    if not messages:
        print("No messages found in JSON file.")
        sys.exit(1)
    
    print(f"Found {len(messages)} messages in JSON file")
    
    # 데이터베이스 세션 생성
    db = SessionLocal()
    
    try:
        # 카테고리 생성
        print("Creating categories...")
        create_categories_from_messages(db, messages)
        
        # 메시지 마이그레이션
        print("Migrating messages...")
        migrated_count, skipped_count = migrate_messages_to_db(db, messages)
        
        print("\n" + "="*50)
        print("MIGRATION COMPLETED")
        print("="*50)
        print(f"Environment: {ENVIRONMENT}")
        print(f"Total messages in JSON: {len(messages)}")
        print(f"Successfully migrated: {migrated_count}")
        print(f"Skipped (duplicates): {skipped_count}")
        print(f"Errors: {len(messages) - migrated_count - skipped_count}")
        
        # 데이터베이스 확인
        total_in_db = db.query(DailyMessage).count()
        active_in_db = db.query(DailyMessage).filter(DailyMessage.is_active == True).count()
        categories_in_db = db.query(MessageCategory).count()
        
        print(f"\nDatabase Status:")
        print(f"Total messages in DB: {total_in_db}")
        print(f"Active messages in DB: {active_in_db}")
        print(f"Categories in DB: {categories_in_db}")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()