#!/usr/bin/env python3
"""
데이터베이스 스키마 분리 및 환경별 설정
"""

import psycopg2
import sys
import os
from datetime import datetime

# 환경별 데이터베이스 설정
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432,
    'sslmode': 'require'
}

# 스키마 생성 및 테이블 생성 SQL
SCHEMA_SETUP_SQL = """
-- 개발 환경용 스키마 생성
CREATE SCHEMA IF NOT EXISTS morning_dev;

-- 운영 환경용 스키마 생성 (나중에 사용)
CREATE SCHEMA IF NOT EXISTS morning_prod;

-- 개발 스키마에 모닝 앱 테이블들 생성
SET search_path TO morning_dev;

-- 사용자 테이블 (모닝 앱 전용)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- 인덱스
    CONSTRAINT users_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- 사용자 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR(100) NOT NULL,
    message_data JSONB NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 유니크 제약 (사용자당 메시지 중복 방지)
    UNIQUE(user_id, message_id)
);

-- 메시지 히스토리 테이블
CREATE TABLE IF NOT EXISTS message_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR(100) NOT NULL,
    message_data JSONB NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 일기 엔트리 테이블
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT,
    mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
    weather VARCHAR(50),
    tags TEXT[], -- 태그 배열
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 유니크 제약 (사용자당 날짜별 하나의 일기)
    UNIQUE(user_id, date)
);

-- 사용자 목표 테이블
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('health', 'study', 'work', 'relationship', 'hobby', 'other')),
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    target_count INTEGER DEFAULT 1,
    current_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    start_date DATE DEFAULT CURRENT_DATE,
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 체크 제약
    CONSTRAINT positive_target_count CHECK (target_count > 0),
    CONSTRAINT valid_current_count CHECK (current_count >= 0),
    CONSTRAINT valid_date_range CHECK (target_date IS NULL OR target_date >= start_date)
);

-- 사용자 메시지 테이블 (커뮤니티 기능)
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    author_name VARCHAR(100), -- 작성자명 (익명 가능)
    category VARCHAR(50) NOT NULL,
    tags TEXT[], -- 태그 배열
    time_of_day VARCHAR(20) CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
    season VARCHAR(20) DEFAULT 'all' CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all')),
    is_approved BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 체크 제약
    CONSTRAINT positive_like_count CHECK (like_count >= 0),
    CONSTRAINT positive_view_count CHECK (view_count >= 0),
    CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- 메시지 반응 테이블
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR(100) NOT NULL, -- user_messages.id 또는 외부 메시지 ID
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'heart', 'fire', 'clap', 'thinking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 유니크 제약 (사용자당 메시지별 하나의 반응)
    UNIQUE(user_id, message_id, reaction_type)
);

-- 사용자 설정 테이블 (확장용)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 유니크 제약
    UNIQUE(user_id, setting_key)
);

-- 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'view_message', 'add_favorite', etc.
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_added_at ON user_favorites(added_at);
CREATE INDEX IF NOT EXISTS idx_message_history_user_id ON message_history(user_id);
CREATE INDEX IF NOT EXISTS idx_message_history_viewed_at ON message_history(viewed_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_type_status ON user_goals(goal_type, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_messages_category ON user_messages(category);
CREATE INDEX IF NOT EXISTS idx_user_messages_public_approved ON user_messages(is_public, is_approved);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON user_activity_logs(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at);

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

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초기 테스트 데이터 삽입
INSERT INTO users (username, email, password_hash, display_name) 
VALUES ('admin', 'admin@morning.app', 'admin_hash_here', '관리자')
ON CONFLICT (username) DO NOTHING;

-- search_path를 기본값으로 되돌림
SET search_path TO public;
"""

def setup_schemas():
    """스키마 및 테이블 설정"""
    try:
        print("=== 모닝 앱 데이터베이스 스키마 설정 ===\n")
        
        # 연결 정보 출력
        print(f"데이터베이스: {DB_CONFIG['host']}/{DB_CONFIG['database']}")
        print(f"사용자: {DB_CONFIG['user']}")
        print(f"SSL 모드: {DB_CONFIG.get('sslmode', 'disable')}")
        
        print("\n데이터베이스 연결 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("스키마 및 테이블 생성 중...")
        cur.execute(SCHEMA_SETUP_SQL)
        conn.commit()
        
        print("[SUCCESS] 스키마 및 테이블 생성 완료!")
        
        # 생성된 스키마 확인
        cur.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'morning_%'
            ORDER BY schema_name;
        """)
        schemas = cur.fetchall()
        
        print(f"\n생성된 스키마: {[s[0] for s in schemas]}")
        
        # 각 스키마의 테이블 확인
        for schema in schemas:
            schema_name = schema[0]
            cur.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '{schema_name}'
                ORDER BY table_name;
            """)
            tables = cur.fetchall()
            print(f"\n[{schema_name}] 테이블: {[t[0] for t in tables]}")
        
        # 개발 스키마의 테이블 상세 정보
        print(f"\n=== morning_dev 스키마 테이블 구조 ===")
        for table_name in ['users', 'user_favorites', 'journal_entries', 'user_goals']:
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'morning_dev' AND table_name = '{table_name}'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            if columns:
                print(f"\n[{table_name}]:")
                for col in columns:
                    nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                    print(f"  - {col[0]}: {col[1]} ({nullable})")
        
        cur.close()
        conn.close()
        
        print("\n=== 설정 완료 ===")
        print("개발 환경: morning_dev 스키마 사용")
        print("운영 환경: morning_prod 스키마 사용 (향후)")
        
        return True
        
    except Exception as error:
        print(f"[ERROR] 설정 실패: {error}")
        return False

def create_env_config():
    """환경별 설정 파일 생성"""
    
    # 개발 환경 설정
    dev_config = """# 개발 환경 설정
DATABASE_URL=postgresql://untab:0AbVNOIsl2dn@ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app:5432/untab?sslmode=require
DATABASE_SCHEMA=morning_dev
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=dev_secret_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:5500
API_PORT=8001
"""
    
    # 운영 환경 설정 템플릿
    prod_config = """# 운영 환경 설정
DATABASE_URL=postgresql://untab:0AbVNOIsl2dn@ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app:5432/untab?sslmode=require
DATABASE_SCHEMA=morning_prod
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=prod_secret_key_here_change_this
CORS_ORIGINS=https://your-domain.com
API_PORT=8000
"""
    
    with open('.env.dev', 'w', encoding='utf-8') as f:
        f.write(dev_config)
    
    with open('.env.prod.template', 'w', encoding='utf-8') as f:
        f.write(prod_config)
    
    print("환경 설정 파일 생성:")
    print("- .env.dev (개발용)")
    print("- .env.prod.template (운영용 템플릿)")

if __name__ == "__main__":
    if setup_schemas():
        create_env_config()
        print(f"\n=== 모든 설정 완료! ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===")
    else:
        print("\n=== 설정 실패! ===")
        sys.exit(1)