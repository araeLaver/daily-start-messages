/**
 * UI 관리 모듈
 * 햄버거 메뉴, 모달, 애니메이션 등 UI 관련 기능 관리
 */

import { DOM, Animation, ErrorHandler, Security } from './utils.js';

export class UIManager {
    constructor() {
        this.sidebar = null;
        this.sidebarOverlay = null;
        this.hamburgerBtn = null;
        this.modals = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * UI 매니저 초기화
     */
    init() {
        try {
            this.initElements();
            this.bindEvents();
            this.isInitialized = true;
            console.log('UI Manager initialized successfully');
        } catch (error) {
            ErrorHandler.handle(error, 'UIManager.init', true);
        }
    }

    /**
     * DOM 엘리먼트 초기화
     */
    initElements() {
        this.sidebar = DOM.$('#sidebar');
        this.sidebarOverlay = DOM.$('#sidebarOverlay');
        this.hamburgerBtn = DOM.$('#hamburgerBtn');
        
        // 모달들 등록
        const modalElements = DOM.$$('.modal');
        modalElements.forEach(modal => {
            this.modals.set(modal.id, modal);
        });
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 햄버거 메뉴 버튼
        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        // 사이드바 닫기 버튼
        const sidebarClose = DOM.$('#sidebarClose');
        if (sidebarClose) {
            sidebarClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSidebar();
            });
        }

        // 사이드바 오버레이 클릭
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // 모달 닫기 버튼들
        this.modals.forEach((modal) => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modal.id);
                });
            }

            // 모달 외부 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // ESC 키로 모달/사이드바 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeSidebar();
            }
        });

        // 접근성: 포커스 트랩
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabKey(e);
            }
        });
    }

    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        if (!this.sidebar) return;

        const isOpen = this.sidebar.classList.contains('open');
        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * 사이드바 열기
     */
    async openSidebar() {
        if (!this.sidebar || !this.sidebarOverlay || !this.hamburgerBtn) return;

        try {
            // 애니메이션과 함께 열기
            this.sidebar.classList.add('open');
            this.sidebarOverlay.classList.add('show');
            this.hamburgerBtn.classList.add('active');

            // body 스크롤 방지
            document.body.style.overflow = 'hidden';

            // 첫 번째 메뉴 아이템에 포커스
            const firstMenuItem = this.sidebar.querySelector('.menu-item');
            if (firstMenuItem) {
                firstMenuItem.focus();
            }

            // 접근성: aria 속성 업데이트
            this.sidebar.setAttribute('aria-hidden', 'false');
            this.hamburgerBtn.setAttribute('aria-expanded', 'true');

        } catch (error) {
            ErrorHandler.handle(error, 'UIManager.openSidebar');
        }
    }

    /**
     * 사이드바 닫기
     */
    async closeSidebar() {
        if (!this.sidebar || !this.sidebarOverlay || !this.hamburgerBtn) return;

        try {
            // 애니메이션과 함께 닫기
            this.sidebar.classList.remove('open');
            this.sidebarOverlay.classList.remove('show');
            this.hamburgerBtn.classList.remove('active');

            // body 스크롤 복원
            document.body.style.overflow = '';

            // 접근성: aria 속성 업데이트
            this.sidebar.setAttribute('aria-hidden', 'true');
            this.hamburgerBtn.setAttribute('aria-expanded', 'false');

            // 햄버거 버튼에 포커스 복원
            this.hamburgerBtn.focus();

        } catch (error) {
            ErrorHandler.handle(error, 'UIManager.closeSidebar');
        }
    }

    /**
     * 모달 열기
     * @param {string} modalId - 모달 ID
     * @param {Object} options - 옵션
     */
    async openModal(modalId, options = {}) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.warn(`Modal with ID "${modalId}" not found`);
            return;
        }

        try {
            // 다른 모달들 닫기
            this.closeAllModals();

            // 모달 표시
            modal.style.display = 'flex';
            await Animation.fadeIn(modal, 300);

            // body 스크롤 방지
            document.body.style.overflow = 'hidden';

            // 첫 번째 포커스 가능한 엘리먼트에 포커스
            const focusableElement = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElement) {
                focusableElement.focus();
            }

            // 접근성: aria 속성 업데이트
            modal.setAttribute('aria-hidden', 'false');

            // 콜백 실행
            if (options.onOpen) {
                options.onOpen(modal);
            }

        } catch (error) {
            ErrorHandler.handle(error, `UIManager.openModal(${modalId})`);
        }
    }

    /**
     * 모달 닫기
     * @param {string} modalId - 모달 ID
     * @param {Object} options - 옵션
     */
    async closeModal(modalId, options = {}) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        try {
            // 애니메이션과 함께 닫기
            await Animation.fadeOut(modal, 300);
            modal.style.display = 'none';

            // body 스크롤 복원 (다른 모달이 열려있지 않은 경우)
            const openModals = Array.from(this.modals.values()).filter(m => 
                m.style.display !== 'none' && getComputedStyle(m).display !== 'none'
            );
            
            if (openModals.length === 0) {
                document.body.style.overflow = '';
            }

            // 접근성: aria 속성 업데이트
            modal.setAttribute('aria-hidden', 'true');

            // 콜백 실행
            if (options.onClose) {
                options.onClose(modal);
            }

        } catch (error) {
            ErrorHandler.handle(error, `UIManager.closeModal(${modalId})`);
        }
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        this.modals.forEach((modal, modalId) => {
            if (modal.style.display !== 'none' && getComputedStyle(modal).display !== 'none') {
                this.closeModal(modalId);
            }
        });
    }

    /**
     * 알림 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, error, warning, info)
     * @param {number} duration - 표시 시간 (ms)
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 기존 알림들 제거
        const existingNotifications = DOM.$$('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${Security.escapeHtml(message)}</span>
                <button class="notification-close" aria-label="알림 닫기">&times;</button>
            </div>
        `;

        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: '10000',
            background: type === 'error' ? '#ef4444' : 
                       type === 'success' ? '#10b981' : 
                       type === 'warning' ? '#f59e0b' : '#3b82f6',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px'
        });

        // DOM에 추가
        document.body.appendChild(notification);

        // 애니메이션
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // 자동 숨김
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * 알림 숨기기
     * @param {Element} notification - 알림 엘리먼트
     */
    hideNotification(notification) {
        if (!notification || !notification.parentNode) return;

        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 로딩 스피너 표시/숨김
     * @param {boolean} show - 표시 여부
     * @param {string} message - 로딩 메시지
     */
    toggleLoading(show, message = '로딩 중...') {
        let loader = DOM.$('#globalLoader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.className = 'global-loader';
                loader.innerHTML = `
                    <div class="loader-content">
                        <div class="loader-spinner"></div>
                        <div class="loader-message">${message}</div>
                    </div>
                `;
                
                // 스타일 적용
                Object.assign(loader.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: '9999',
                    backdropFilter: 'blur(5px)'
                });
                
                document.body.appendChild(loader);
            }
            
            Animation.fadeIn(loader, 200);
        } else if (loader) {
            Animation.fadeOut(loader, 200).then(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            });
        }
    }

    /**
     * Tab 키 처리 (포커스 트랩)
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    handleTabKey(e) {
        // 사이드바가 열려있을 때
        if (this.sidebar && this.sidebar.classList.contains('open')) {
            const focusableElements = this.sidebar.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }

        // 모달이 열려있을 때도 비슷한 로직 적용 가능
    }

    /**
     * 반응형 업데이트
     */
    updateResponsive() {
        const isMobile = window.innerWidth <= 640;
        
        // 모바일에서 사이드바 자동 닫기
        if (isMobile && this.sidebar && this.sidebar.classList.contains('open')) {
            this.closeSidebar();
        }
    }

    /**
     * 인증 모달 표시
     * @param {string} mode - 'login' 또는 'register'
     */
    async showAuthModal(mode = 'login') {
        let authModal = this.modals.get('authModal');
        if (!authModal) {
            authModal = this.createAuthModal();
            this.modals.set('authModal', authModal);
        }
        
        this.updateAuthModal(authModal, mode);
        await this.openModal('authModal');
    }

    /**
     * 인증 모달 생성
     */
    createAuthModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-labelledby', 'authModalTitle');
        modal.style.display = 'none';
        
        document.body.appendChild(modal);
        
        // 모달 닫기 이벤트 바인딩
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal('authModal');
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('authModal');
            }
        });
        
        return modal;
    }

    /**
     * 인증 모달 내용 업데이트
     * @param {Element} modal - 모달 엘리먼트
     * @param {string} mode - 'login' 또는 'register'
     */
    updateAuthModal(modal, mode) {
        const isLogin = mode === 'login';
        const title = isLogin ? '로그인' : '회원가입';
        const switchText = isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?';
        const switchLink = isLogin ? '회원가입' : '로그인';
        const switchMode = isLogin ? 'register' : 'login';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="authModalTitle">${title}</h2>
                    <button class="modal-close" aria-label="모달 닫기">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="authForm" class="auth-form">
                        <div class="form-group">
                            <label for="username">사용자명</label>
                            <input type="text" id="username" name="username" required 
                                   placeholder="영문, 숫자, 언더스코어 3-20자">
                        </div>
                        
                        ${!isLogin ? `
                        <div class="form-group">
                            <label for="email">이메일 (선택)</label>
                            <input type="email" id="email" name="email" 
                                   placeholder="example@email.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="displayName">표시 이름 (선택)</label>
                            <input type="text" id="displayName" name="displayName" 
                                   placeholder="다른 사용자에게 보여질 이름">
                        </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label for="password">비밀번호</label>
                            <input type="password" id="password" name="password" required 
                                   placeholder="최소 6자 이상">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="authSubmitBtn">
                                ${title}
                            </button>
                        </div>
                        
                        <div class="auth-switch">
                            <span>${switchText}</span>
                            <a href="#" id="authSwitchLink">${switchLink}</a>
                        </div>
                    </form>
                    
                    <div id="authError" class="auth-error" style="display: none;"></div>
                    <div id="authSuccess" class="auth-success" style="display: none;"></div>
                </div>
            </div>
        `;
        
        // 폼 이벤트 바인딩
        const form = modal.querySelector('#authForm');
        const switchLink = modal.querySelector('#authSwitchLink');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit(mode);
        });
        
        switchLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.updateAuthModal(modal, switchMode);
        });
    }

    /**
     * 인증 폼 제출 처리
     * @param {string} mode - 'login' 또는 'register'
     */
    async handleAuthSubmit(mode) {
        const form = DOM.$('#authForm');
        const submitBtn = DOM.$('#authSubmitBtn');
        const errorDiv = DOM.$('#authError');
        const successDiv = DOM.$('#authSuccess');
        
        if (!form) return;
        
        // 폼 데이터 수집
        const formData = new FormData(form);
        const data = {
            username: Security.sanitizeInput(formData.get('username'), 20),
            password: formData.get('password')
        };
        
        if (mode === 'register') {
            data.email = formData.get('email') || null;
            data.display_name = Security.sanitizeInput(formData.get('displayName'), 100) || null;
        }
        
        // 기본 검증
        if (!data.username || !data.password) {
            this.showAuthError('모든 필수 필드를 입력해주세요.');
            return;
        }
        
        if (data.username.length < 3 || data.username.length > 20) {
            this.showAuthError('사용자명은 3-20자 사이여야 합니다.');
            return;
        }
        
        if (data.password.length < 6) {
            this.showAuthError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }
        
        try {
            // 로딩 상태
            submitBtn.disabled = true;
            submitBtn.textContent = '처리 중...';
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            // API 호출
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const response = await fetch(`http://localhost:8001${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 성공 처리
                localStorage.setItem('authToken', result.access_token);
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                this.showAuthSuccess(mode === 'login' ? '로그인되었습니다!' : '회원가입이 완료되었습니다!');
                
                // 모달 닫기 및 UI 업데이트
                setTimeout(() => {
                    this.closeModal('authModal');
                    this.showNotification(
                        mode === 'login' ? '로그인되었습니다!' : '회원가입이 완료되었습니다!', 
                        'success'
                    );
                    // 사용자 상태 업데이트 이벤트 발생
                    window.dispatchEvent(new CustomEvent('userAuthenticated', { 
                        detail: { user: result.user, token: result.access_token } 
                    }));
                }, 1500);
                
            } else {
                // 오류 처리
                this.showAuthError(result.detail || '오류가 발생했습니다.');
            }
            
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError('네트워크 오류가 발생했습니다.');
        } finally {
            // 버튼 상태 복원
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'login' ? '로그인' : '회원가입';
        }
    }
    
    /**
     * 인증 오류 표시
     * @param {string} message - 오류 메시지
     */
    showAuthError(message) {
        const errorDiv = DOM.$('#authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    /**
     * 인증 성공 표시
     * @param {string} message - 성공 메시지
     */
    showAuthSuccess(message) {
        const successDiv = DOM.$('#authSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }

    /**
     * UI 매니저 정리
     */
    destroy() {
        // 이벤트 리스너 제거
        // 메모리 누수 방지를 위해 필요한 경우 구현
        this.isInitialized = false;
    }
}

// 글로벌 UI 매니저 인스턴스
export const uiManager = new UIManager();