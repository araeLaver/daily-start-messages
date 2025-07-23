# 🚀 빠른 설정 가이드

## 📋 1단계: Git 저장소 초기화

```bash
# 현재 디렉토리에서 실행
cd /Users/down/daily-quotes-app

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋
git commit -m "🎉 초기 프로젝트 설정

- PWA 기반 하루의 시작 메시지 앱
- 65개 이상의 메시지 데이터베이스
- 관리자 기능 포함
- 자동 배포 시스템 구축
- 안드로이드 앱 출시 준비 완료"

# GitHub 원격 저장소 연결 (저장소 생성 후)
git remote add origin https://github.com/yourusername/daily-start-messages.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 🌐 2단계: Netlify 자동 배포

### 방법 1: 웹 인터페이스 (가장 쉬움)

1. **Netlify 계정 생성**: https://netlify.com
2. **"New site from Git"** 클릭
3. **GitHub 계정 연결**
4. **저장소 선택**: `daily-start-messages`
5. **배포 설정**:
   ```
   Build command: echo "Build complete"
   Publish directory: .
   ```
6. **"Deploy site"** 클릭
7. **자동 생성된 URL 확인**: `https://random-name.netlify.app`

### 방법 2: CLI 사용

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로그인
netlify login

# 현재 디렉토리에서 초기화
netlify init

# 설정 선택:
# - Create & configure a new site
# - 팀 선택
# - 사이트 이름: daily-start-messages

# 첫 배포
netlify deploy

# 프로덕션 배포
netlify deploy --prod
```

## 🔧 3단계: GitHub 시크릿 설정

GitHub Actions가 Netlify에 자동 배포하려면:

1. **Netlify Personal Access Token 생성**:
   - Netlify Dashboard → User Settings → Applications
   - "New access token" 생성
   - 토큰 복사

2. **Netlify Site ID 확인**:
   - Site Dashboard → Site Settings → General
   - Site ID 복사

3. **GitHub Secrets 설정**:
   - GitHub 저장소 → Settings → Secrets and variables → Actions
   - "New repository secret" 클릭
   - 추가할 시크릿:
     ```
     NETLIFY_AUTH_TOKEN: your-personal-access-token
     NETLIFY_SITE_ID: your-site-id
     ```

## ✅ 4단계: 자동 배포 테스트

```bash
# 테스트 커밋
echo "<!-- 배포 테스트 -->" >> index.html
git add .
git commit -m "test: 자동 배포 테스트"
git push origin main

# GitHub Actions 확인
# 1. GitHub 저장소 → Actions 탭
# 2. 워크플로우 실행 상태 확인
# 3. 2-3분 후 웹사이트에서 변경사항 확인
```

## 📱 5단계: PWA Builder APK 생성

```bash
# 배포된 사이트 URL 사용
# 1. https://www.pwabuilder.com/ 접속
# 2. Netlify URL 입력: https://your-site.netlify.app
# 3. "Start" 클릭
# 4. Android 탭에서 "Generate Package" 클릭
# 5. APK 파일 다운로드
```

## 🎯 완료 체크리스트

- [ ] Git 저장소 초기화 및 GitHub 업로드
- [ ] Netlify 자동 배포 설정
- [ ] GitHub Actions 시크릿 설정
- [ ] 자동 배포 테스트 성공
- [ ] PWA Builder로 APK 생성
- [ ] Google Play Console 계정 생성 ($25)
- [ ] 앱 스토어 메타데이터 준비
- [ ] 첫 번째 앱 출시!

## 🔄 일상적인 업데이트 워크플로우

```bash
# 새 메시지 추가
vim messages.json
git add messages.json
git commit -m "feat: 새로운 동기부여 메시지 10개 추가"
git push origin main

# → 자동으로 2-3분 내 웹사이트 업데이트!
# → PWA 사용자들도 자동으로 새 버전 받음!
```

## 🆘 문제 해결

### 배포 실패 시
```bash
# GitHub Actions 로그 확인
# Netlify 빌드 로그 확인
# 문제 수정 후 다시 푸시

# 긴급시 이전 버전으로 롤백
git revert HEAD
git push origin main
```

### PWA가 업데이트 안 될 때
```bash
# 브라우저 캐시 강제 새로고침
# Chrome: Ctrl+Shift+R
# Service Worker 강제 업데이트
```

---

## 🎉 축하합니다!

이제 **완전 자동화된 배포 시스템**이 구축되었습니다!

- 🔄 **코드 수정 → Git Push → 자동 배포**
- 📱 **PWA → 앱스토어 배포 준비 완료**
- 🚀 **실시간 업데이트 시스템**

**더 이상 수동 배포는 그만! 코딩에만 집중하세요!** ✨