# 🌅 하루의 시작 - Daily Start Messages

[![Netlify Status](https://api.netlify.com/api/v1/badges/6fe8b80e-c5cc-4c8e-8d0f-9a2e4b5c6d7e/deploy-status)](https://app.netlify.com/sites/daily-start-messages/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

새로운 하루를 시작하는 따뜻하고 힘이 되는 명언과 메시지를 만나보세요.

## 🚀 데모 및 다운로드

- **🌐 웹 앱**: [https://daily-start-messages.netlify.app](https://daily-start-messages.netlify.app)
- **📱 PWA 설치**: 브라우저에서 직접 앱 설치 가능
- **⚡ 빠른 액세스**: 북마크로 바로 접속

## ✨ 주요 기능

- **🌄 시간별 맞춤 메시지**: 아침, 오후, 저녁, 새벽 각 시간대별 메시지
- **📚 풍부한 콘텐츠**: 45개의 엄선된 명언과 동기부여 메시지, 다양한 카테고리
- **⚙️ 관리 기능**: 메시지 추가/수정/삭제, 카테고리별 관리
- **📱 PWA 지원**: 앱처럼 설치하여 오프라인에서도 사용 가능
- **🎨 반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **🔄 실시간 업데이트**: Git 기반 자동 배포로 즉시 반영

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA**: Service Worker, Web App Manifest
- **배포**: Netlify (자동 배포)
- **버전관리**: Git/GitHub
- **CI/CD**: GitHub Actions

## 🚀 빠른 시작

### 로컬 개발

```bash
# 저장소 클론
git clone https://github.com/araeLaver/daily-start-messages.git
cd daily-start-messages

# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js live-server
npx live-server

# 브라우저에서 접속
open http://localhost:8000
```

### 배포

```bash
# 변경사항 커밋 및 푸시
git add .
git commit -m "feat: 새로운 메시지 추가"
git push origin main

# Netlify에서 자동으로 배포됩니다!
```

## 📱 PWA 설치

### 모바일 (Android/iOS)
1. 웹사이트 방문
2. 브라우저 메뉴에서 "홈 화면에 추가" 선택
3. 앱 아이콘으로 접속

### 데스크톱 (Chrome/Edge)
1. 주소창 옆 설치 아이콘 클릭
2. "설치" 버튼 클릭
3. 독립 앱으로 실행

## 🔧 개발 가이드

### 프로젝트 구조

```
daily-start-messages/
├── index.html              # 메인 페이지
├── styles.css              # 스타일시트
├── script.js               # 메인 JavaScript
├── messages.json           # 메시지 데이터베이스
├── manifest.json           # PWA 매니페스트
├── service-worker.js       # 서비스 워커
├── generate-icons.html     # 아이콘 생성 도구
├── icons/                  # PWA 아이콘들
├── screenshots/            # 앱 스크린샷
├── .github/workflows/      # GitHub Actions
├── netlify.toml           # Netlify 설정
└── README.md              # 프로젝트 문서
```

### 새 메시지 추가

1. `messages.json` 파일 수정:

```json
{
  "id": 46,
  "text": "새로운 메시지 내용",
  "author": "작성자명",
  "category": "카테고리",
  "timeOfDay": "morning",
  "createdAt": "2024-01-01"
}
```

2. Git 커밋 및 푸시:

```bash
git add messages.json
git commit -m "feat: 새로운 아침 메시지 추가"
git push origin main
```

3. 자동으로 배포됩니다!

### 새 카테고리 추가

1. `messages.json`의 `categories` 배열에 추가
2. HTML의 `<select>` 옵션에 추가
3. 해당 카테고리의 메시지들 추가

### 커스텀 스타일링

CSS 변수를 수정하여 테마 변경:

```css
:root {
  --primary-color: #f59e0b;    /* 메인 색상 */
  --background: #fef3c7;       /* 배경 색상 */
  --text-primary: #1f2937;     /* 텍스트 색상 */
}
```
### 커밋 메시지 규칙

```bash
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정, 패키지 매니저 수정
```

## 📊 브라우저 지원

| 브라우저 | 버전 | PWA 지원 | 오프라인 |
|---------|------|----------|----------|
| Chrome  | 67+  | ✅       | ✅       |
| Firefox | 79+  | ✅       | ✅       |
| Safari  | 11.1+| ✅       | ✅       |
| Edge    | 79+  | ✅       | ✅       |

## 📈 로드맵

### v1.1 (진행중)
- [ ] 다크모드 토글
- [ ] 즐겨찾기 기능
- [ ] 메시지 검색
- [ ] 위젯 지원

### v1.2 (계획중)
- [ ] 사용자 정의 메시지
- [ ] 알림 설정
- [ ] 통계 대시보드
- [ ] 데이터 백업/복원

### v2.0 (장기계획)
- [ ] 다국어 지원 (영어, 일본어)
- [ ] AI 추천 메시지
- [ ] 소셜 기능
- [ ] 프리미엄 기능


## 📞 연락처

- **이메일**: kimdan2@nate.com
