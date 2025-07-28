#!/usr/bin/env python3
"""
기존 데이터베이스 구조 확인
"""

import psycopg2

# 데이터베이스 연결 정보
DB_CONFIG = {
    'host': 'ep-blue-unit-a2ev3s9x.eu-central-1.pg.koyeb.app',
    'database': 'untab',
    'user': 'untab',
    'password': '0AbVNOIsl2dn',
    'port': 5432
}

def check_existing_tables():
    """기존 테이블 구조를 확인합니다."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 모든 테이블 조회
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cur.fetchall()
        print("=== 기존 테이블 목록 ===")
        for table in tables:
            print(f"- {table[0]}")
        
        # 각 테이블의 구조 확인
        for table in tables:
            table_name = table[0]
            print(f"\n=== {table_name} 테이블 구조 ===")
            
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                default = f" DEFAULT {col[3]}" if col[3] else ""
                print(f"  {col[0]}: {col[1]} ({nullable}){default}")
        
        # users 테이블이 우리가 필요한 컬럼을 가지고 있는지 확인
        print("\n=== users 테이블 분석 ===")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """)
        user_columns = [col[0] for col in cur.fetchall()]
        
        required_columns = ['id', 'username', 'email', 'password_hash', 'display_name']
        missing_columns = [col for col in required_columns if col not in user_columns]
        
        if missing_columns:
            print(f"누락된 컬럼: {missing_columns}")
            print("테이블 수정이 필요합니다.")
        else:
            print("users 테이블이 기본 요구사항을 만족합니다!")
        
        # 테스트 사용자 추가해보기
        print("\n=== 테스트 사용자 추가 ===")
        try:
            # 기존 테스트 사용자 삭제
            cur.execute("DELETE FROM users WHERE username = 'testuser';")
            
            # 새 테스트 사용자 추가
            cur.execute("""
                INSERT INTO users (username, email, password_hash, display_name) 
                VALUES ('testuser', 'test@example.com', 'hashed_password_123', 'Test User')
                RETURNING id, username;
            """)
            user = cur.fetchone()
            print(f"테스트 사용자 생성 성공: ID={user[0]}, 사용자명={user[1]}")
            
            conn.commit()
            
        except Exception as e:
            print(f"테스트 사용자 생성 실패: {e}")
            conn.rollback()
        
        cur.close()
        conn.close()
        
        return True
        
    except Exception as error:
        print(f"오류 발생: {error}")
        return False

if __name__ == "__main__":
    check_existing_tables()