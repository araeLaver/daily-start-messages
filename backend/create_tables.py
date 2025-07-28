#!/usr/bin/env python3
"""
데이터베이스 테이블 생성 스크립트
Koyeb PostgreSQL에 실제로 테이블을 생성합니다.
"""

import psycopg2
from psycopg2 import sql
import sys

# 데이터베이스 연결 정보
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432
}

# 테이블 생성 SQL
CREATE_TABLES_SQL = """
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- 사용자 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS user_favorites (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR NOT NULL,
    message_data JSONB NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 히스토리 테이블
CREATE TABLE IF NOT EXISTS message_history (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR NOT NULL,
    message_data JSONB NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 일기 엔트리 테이블
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(10) NOT NULL, -- YYYY-MM-DD 형식
    content TEXT,
    mood VARCHAR(20), -- great, good, okay, bad, terrible
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 사용자 목표 테이블
CREATE TABLE IF NOT EXISTS user_goals (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- health, study, work, relationship, hobby, other
    goal_type VARCHAR(20) NOT NULL, -- weekly, monthly
    target_count INTEGER DEFAULT 1,
    current_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    target_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 메시지 테이블
CREATE TABLE IF NOT EXISTS user_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    time_of_day VARCHAR(20), -- morning, afternoon, evening, night
    season VARCHAR(20) DEFAULT 'all', -- spring, summer, autumn, winter, all
    is_approved BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 메시지 반응 테이블
CREATE TABLE IF NOT EXISTS message_reactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR NOT NULL,
    reaction_type VARCHAR(20) NOT NULL, -- like, heart, fire
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, message_id, reaction_type)
);

-- 사용자 세션 테이블 (선택적)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_message_history_user_id ON message_history(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_message ON message_reactions(user_id, message_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
CREATE TRIGGER update_user_goals_updated_at 
    BEFORE UPDATE ON user_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_messages_updated_at ON user_messages;
CREATE TRIGGER update_user_messages_updated_at 
    BEFORE UPDATE ON user_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

def create_tables():
    """데이터베이스에 테이블을 생성합니다."""
    try:
        print("데이터베이스 연결 중...")
        
        # 데이터베이스 연결
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("테이블 생성 중...")
        
        # 테이블 생성 실행
        cur.execute(CREATE_TABLES_SQL)
        conn.commit()
        
        print("[SUCCESS] 모든 테이블이 성공적으로 생성되었습니다!")
        
        # 생성된 테이블 확인
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cur.fetchall()
        print("\n[INFO] 생성된 테이블 목록:")
        for table in tables:
            print(f"  - {table[0]}")
            
        # 테이블 구조 확인
        print("\n[INFO] 주요 테이블 구조 확인:")
        for table_name in ['users', 'user_favorites', 'message_history', 'journal_entries']:
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            print(f"\n  [TABLE] {table_name}:")
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                print(f"    - {col[0]}: {col[1]} ({nullable})")
        
        cur.close()
        conn.close()
        
        print("\n[SUCCESS] 데이터베이스 설정이 완료되었습니다!")
        print("이제 FastAPI 서버를 실행할 수 있습니다.")
        
    except Exception as error:
        print(f"[ERROR] 오류 발생: {error}")
        return False
        
    return True

def test_connection():
    """데이터베이스 연결을 테스트합니다."""
    try:
        print("연결 테스트 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"[SUCCESS] 연결 성공! PostgreSQL 버전: {version[0]}")
        cur.close()
        conn.close()
        return True
    except Exception as error:
        print(f"[ERROR] 연결 실패: {error}")
        return False

if __name__ == "__main__":
    print("=== 모닝 앱 데이터베이스 설정 시작 ===\n")
    
    # 연결 테스트
    if not test_connection():
        sys.exit(1)
    
    print()
    
    # 테이블 생성
    if create_tables():
        print("\n=== 모든 작업이 완료되었습니다! ===")
    else:
        print("\n=== 작업 실패! ===")
        sys.exit(1)