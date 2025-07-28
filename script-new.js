/**
 * 모닝 앱 - 새로운 모듈화된 메인 스크립트
 * ES6 모듈을 사용한 개선된 아키텍처
 */

import { uiManager } from './js/ui-manager.js';
import { messageManager } from './js/message-manager.js';
import { featureManager } from './js/feature-manager.js';
import { Storage, DateUtils, ErrorHandler, Performance } from './js/utils.js';

// 앱 초기화
class MorningApp {
    constructor() {
        this.isInitialized = false;
        this.settings = {
            darkMode: false,
            notifications: false,
            notificationTime: '08:00',
            seasonal: true,
            specialDay: true,
            events: true,
            userName: '',
            theme: 'default',
            displayMode: 'card'
        };
        
        this.streakData = {
            current: 0,
            lastVisit: null,
            total: 0
        };

        this.init();
    }

    /**
     * 앱 초기화
     */
    async init() {
        try {
            // 에러 핸들러 설정
            this.setupErrorHandlers();
            
            // 설정 로드
            this.loadSettings();
            
            // 스트릭 데이터 업데이트
            this.updateStreakData();
            
            // 이벤트 바인딩
            this.bindGlobalEvents();
            
            // 테마 적용
            this.applyTheme();
            
            // PWA 설정
            this.setupPWA();
            
            // 주기적 업데이트 설정
            this.setupPeriodicUpdates();
            
            // 인증 상태 확인
            this.checkAuthStatus();
            
            this.isInitialized = true;
            console.log('Morning App initialized successfully');
            
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.init', true);
        }
    }

    /**
     * 전역 에러 핸들러 설정
     */
    setupErrorHandlers() {
        // 전역 에러 처리
        window.addEventListener('error', (event) => {
            ErrorHandler.handle(event.error, 'Global Error');
        });

        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault();
        });
    }

    /**
     * 설정 로드
     */
    loadSettings() {
        try {
            const savedSettings = Storage.get('settings', {});
            this.settings = { ...this.settings, ...savedSettings };
            
            const savedStreakData = Storage.get('streakData', {});
            this.streakData = { ...this.streakData, ...savedStreakData };
            
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.loadSettings');
        }
    }

    /**
     * 설정 저장
     */
    saveSettings() {
        try {
            Storage.set('settings', this.settings);
            Storage.set('streakData', this.streakData);
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.saveSettings');
        }
    }

    /**
     * 스트릭 데이터 업데이트
     */
    updateStreakData() {
        try {
            const today = new Date().toDateString();
            const lastVisit = this.streakData.lastVisit;
            
            if (lastVisit !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastVisit === yesterday.toDateString()) {
                    // 연속 방문
                    this.streakData.current++;
                } else if (lastVisit !== null) {
                    // 스트릭 끊김
                    this.streakData.current = 1;
                } else {
                    // 첫 방문
                    this.streakData.current = 1;
                }
                
                this.streakData.lastVisit = today;
                this.streakData.total++;
                
                this.saveSettings();
                this.updateStreakUI();
            }
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.updateStreakData');
        }
    }

    /**
     * 스트릭 UI 업데이트
     */
    updateStreakUI() {
        const streakElements = document.querySelectorAll('#streakNumber');
        streakElements.forEach(el => {
            if (el) el.textContent = this.streakData.current;
        });
        
        // 사용자 인사말 업데이트
        const userGreeting = document.querySelector('.user-greeting');
        if (userGreeting && this.settings.userName) {
            userGreeting.textContent = `안녕하세요, ${this.settings.userName}님!`;
        }
    }

    /**
     * 전역 이벤트 바인딩
     */
    bindGlobalEvents() {
        // 사이드바 메뉴 아이템 클릭
        document.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                this.handleMenuAction(action);
            }
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // 윈도우 리사이즈
        window.addEventListener('resize', Performance.debounce(() => {
            uiManager.updateResponsive();
        }, 250));

        // 온라인/오프라인 상태
        window.addEventListener('online', () => {
            uiManager.showNotification('인터넷에 연결되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            uiManager.showNotification('오프라인 모드입니다.', 'warning');
        });
    }

    /**
     * 메뉴 액션 처리
     * @param {string} action - 액션 타입
     */
    handleMenuAction(action) {
        try {
            switch (action) {
                case 'newQuote':
                    messageManager.showRandomMessage();
                    uiManager.closeSidebar();
                    break;
                    
                case 'categoryFilter':
                    uiManager.openModal('categoryModal');
                    break;
                    
                case 'favorites':
                    featureManager.showFavorites();
                    break;
                    
                case 'history':
                    featureManager.showHistory();
                    break;
                    
                case 'popular':
                    this.showPopular();
                    break;
                    
                case 'share':
                    messageManager.shareMessage();
                    uiManager.closeSidebar();
                    break;
                    
                case 'speak':
                    messageManager.speakMessage();
                    uiManager.closeSidebar();
                    break;
                    
                case 'journal':
                    featureManager.showJournal();
                    break;
                    
                case 'goals':
                    featureManager.showGoals();
                    break;
                    
                case 'submit':
                    featureManager.showSubmit();
                    break;
                    
                case 'invite':
                    this.showInvite();
                    break;
                    
                case 'settings':
                    this.showSettings();
                    break;
                
                case 'login':
                    uiManager.showAuthModal('login');
                    break;
                    
                case 'register':
                    uiManager.showAuthModal('register');
                    break;
                    
                case 'profile':
                    this.showProfile();
                    break;
                    
                case 'logout':
                    this.handleLogout();
                    break;
                    
                default:
                    console.warn(`Unknown menu action: ${action}`);
            }
        } catch (error) {
            ErrorHandler.handle(error, `MorningApp.handleMenuAction(${action})`);
        }
    }

    /**
     * 키보드 단축키 처리
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + 키 조합
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    messageManager.showRandomMessage();
                    break;
                case 'f':
                    e.preventDefault();
                    messageManager.toggleFavorite();
                    break;
                case 's':
                    e.preventDefault();
                    messageManager.shareMessage();
                    break;
            }
        }

        // 단독 키
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                if (!e.target.matches('input, textarea, select')) {
                    messageManager.showRandomMessage();
                }
                break;
        }
    }

    /**
     * 즐겨찾기 모달 표시
     */
    showFavorites() {
        // 기존 모달이 있다면 활용, 없다면 동적 생성
        uiManager.openModal('favoritesModal');
        uiManager.closeSidebar();
    }

    /**
     * 히스토리 모달 표시
     */
    showHistory() {
        uiManager.openModal('historyModal');
        uiManager.closeSidebar();
    }

    /**
     * 인기 메시지 모달 표시
     */
    showPopular() {
        uiManager.openModal('popularModal');
        uiManager.closeSidebar();
    }

    /**
     * 일기 모달 표시
     */
    showJournal() {
        uiManager.openModal('journalModal');
        uiManager.closeSidebar();
    }

    /**
     * 목표 모달 표시
     */
    showGoals() {
        uiManager.openModal('goalsModal');
        uiManager.closeSidebar();
    }

    /**
     * 제출 모달 표시
     */
    showSubmit() {
        uiManager.openModal('submitModal');
        uiManager.closeSidebar();
    }

    /**
     * 초대 모달 표시
     */
    showInvite() {
        uiManager.openModal('inviteModal');
        uiManager.closeSidebar();
    }

    /**
     * 설정 모달 표시
     */
    showSettings() {
        uiManager.openModal('settingsModal');
        uiManager.closeSidebar();
    }

    /**
     * 테마 적용
     */
    applyTheme() {
        try {
            const { theme, darkMode } = this.settings;
            
            // 다크모드 적용
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
            
            // 테마 클래스 적용
            document.body.className = document.body.className
                .replace(/theme-\w+/g, '')
                .concat(` theme-${theme}`);
                
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.applyTheme');
        }
    }

    /**
     * PWA 설정
     */
    setupPWA() {
        // 서비스 워커 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.warn('Service Worker registration failed:', error);
                });
        }

        // 설치 프롬프트 처리
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // 설치 버튼 표시 (필요한 경우)
            const installBtn = document.querySelector('#installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('PWA 설치 승인');
                        }
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    });
                });
            }
        });

        // 알림 권한 요청 (설정에서 허용한 경우)
        if (this.settings.notifications && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleNotification();
                }
            });
        }
    }

    /**
     * 알림 예약
     */
    scheduleNotification() {
        if (!this.settings.notifications || !this.settings.notificationTime) return;

        try {
            const [hour, minute] = this.settings.notificationTime.split(':').map(Number);
            const now = new Date();
            const notificationTime = new Date();
            notificationTime.setHours(hour, minute, 0, 0);

            // 오늘 시간이 지났다면 내일로 설정
            if (notificationTime <= now) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const msUntilNotification = notificationTime.getTime() - now.getTime();

            setTimeout(() => {
                new Notification('모닝 앱', {
                    body: '새로운 하루를 시작할 시간입니다! 🌅',
                    icon: './icons/icon-192x192.png',
                    tag: 'daily-reminder'
                });
                
                // 다음 날 알림 예약
                this.scheduleNotification();
            }, msUntilNotification);

        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.scheduleNotification');
        }
    }

    /**
     * 주기적 업데이트 설정
     */
    setupPeriodicUpdates() {
        // 시간 인사말 업데이트 (1분마다)
        setInterval(() => {
            messageManager.updateUI();
        }, 60000);

        // 데이터 자동 저장 (5분마다)
        setInterval(() => {
            this.saveSettings();
        }, 300000);
    }

    /**
     * 프로필 모달 표시
     */
    showProfile() {
        const user = this.getCurrentUser();
        if (!user) {
            uiManager.showNotification('로그인이 필요합니다.', 'warning');
            return;
        }
        
        // 프로필 모달 동적 생성 또는 표시
        uiManager.openModal('profileModal');
        uiManager.closeSidebar();
    }

    /**
     * 로그아웃 처리
     */
    async handleLogout() {
        try {
            // 로컬 스토리지에서 인증 정보 제거
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            // UI 업데이트
            this.updateAuthUI(false);
            
            uiManager.showNotification('로그아웃되었습니다.', 'success');
            uiManager.closeSidebar();
            
        } catch (error) {
            ErrorHandler.handle(error, 'MorningApp.handleLogout');
            uiManager.showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 현재 사용자 정보 가져오기
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.warn('Failed to parse user data:', error);
            return null;
        }
    }

    /**
     * 인증 토큰 가져오기
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * 인증 상태 확인
     */
    isAuthenticated() {
        return !!(this.getCurrentUser() && this.getAuthToken());
    }

    /**
     * 인증 UI 업데이트
     * @param {boolean} isAuthenticated - 인증 상태
     * @param {Object} user - 사용자 정보
     */
    updateAuthUI(isAuthenticated, user = null) {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const profileBtn = document.getElementById('profileBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userGreeting = document.querySelector('.user-greeting');

        if (isAuthenticated && user) {
            // 로그인 상태
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            if (userGreeting) {
                userGreeting.textContent = `안녕하세요, ${user.display_name || user.username}님!`;
            }
        } else {
            // 로그아웃 상태
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            if (userGreeting) {
                userGreeting.textContent = '안녕하세요!';
            }
        }
    }

    /**
     * 앱 초기화 시 인증 상태 확인
     */
    checkAuthStatus() {
        const user = this.getCurrentUser();
        const token = this.getAuthToken();
        
        if (user && token) {
            this.updateAuthUI(true, user);
            
            // 사용자 인증 상태 이벤트 리스너 추가
            window.addEventListener('userAuthenticated', (event) => {
                this.updateAuthUI(true, event.detail.user);
            });
        } else {
            this.updateAuthUI(false);
        }
    }

    /**
     * 앱 정리
     */
    destroy() {
        // 메모리 누수 방지를 위한 정리 작업
        this.isInitialized = false;
    }
}

// 앱 초기화 - DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {
    window.morningApp = new MorningApp();
});

// 전역 객체로 내보내기 (디버깅 및 콘솔 접근용)
window.uiManager = uiManager;
window.messageManager = messageManager;
window.featureManager = featureManager;