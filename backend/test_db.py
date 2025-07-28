#!/usr/bin/env python3
"""
데이터베이스 권한 및 연결 테스트
"""

import psycopg2
import sys

# 데이터베이스 연결 정보
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432
}

def test_permissions():
    """데이터베이스 권한을 테스트합니다."""
    try:
        print("데이터베이스 연결 중...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 현재 사용자 확인
        cur.execute("SELECT current_user, current_database();")
        user_info = cur.fetchone()
        print(f"현재 사용자: {user_info[0]}")
        print(f"현재 데이터베이스: {user_info[1]}")
        
        # 스키마 권한 확인
        cur.execute("""
            SELECT nspname 
            FROM pg_namespace 
            WHERE nspname NOT LIKE 'pg_%' 
            AND nspname != 'information_schema';
        """)
        schemas = cur.fetchall()
        print(f"사용 가능한 스키마: {[s[0] for s in schemas]}")
        
        # 테이블 생성 권한 테스트
        print("\n테이블 생성 권한 테스트...")
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS test_table (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            print("[SUCCESS] 테이블 생성 권한 있음")
            
            # 테스트 데이터 삽입
            cur.execute("INSERT INTO test_table (name) VALUES ('test');")
            conn.commit()
            print("[SUCCESS] 데이터 삽입 권한 있음")
            
            # 테스트 데이터 조회
            cur.execute("SELECT * FROM test_table;")
            rows = cur.fetchall()
            print(f"[SUCCESS] 데이터 조회 성공: {len(rows)}개 행")
            
            # 테스트 테이블 삭제
            cur.execute("DROP TABLE test_table;")
            conn.commit()
            print("[SUCCESS] 테이블 삭제 권한 있음")
            
        except Exception as e:
            print(f"[ERROR] 테이블 작업 실패: {e}")
            conn.rollback()
        
        # 기존 테이블 확인
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        existing_tables = cur.fetchall()
        print(f"\n기존 테이블: {[t[0] for t in existing_tables]}")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as error:
        print(f"[ERROR] 테스트 실패: {error}")
        return False

def create_simple_tables():
    """권한에 맞게 간단한 테이블들을 생성합니다."""
    try:
        print("\n간단한 테이블 생성 시도...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 사용자 테이블만 먼저 생성
        simple_tables = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100),
                password_hash VARCHAR(255) NOT NULL,
                display_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                settings TEXT DEFAULT '{}'
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                message_id VARCHAR(50),
                message_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS message_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                message_id VARCHAR(50),
                message_text TEXT,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]
        
        for i, sql in enumerate(simple_tables):
            try:
                cur.execute(sql)
                conn.commit()
                print(f"[SUCCESS] 테이블 {i+1} 생성 완료")
            except Exception as e:
                print(f"[ERROR] 테이블 {i+1} 생성 실패: {e}")
                conn.rollback()
        
        # 최종 확인
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cur.fetchall()
        print(f"\n최종 테이블 목록: {[t[0] for t in tables]}")
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as error:
        print(f"[ERROR] 간단한 테이블 생성 실패: {error}")
        return False

if __name__ == "__main__":
    print("=== 데이터베이스 권한 테스트 ===\n")
    
    if test_permissions():
        create_simple_tables()
        print("\n=== 테스트 완료 ===")
    else:
        print("\n=== 테스트 실패 ===")
        sys.exit(1)