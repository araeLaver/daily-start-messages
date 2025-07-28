/**
 * 유틸리티 함수들
 * 보안, 검증, 헬퍼 함수들을 포함
 */

// 보안 관련 함수들
export const Security = {
    /**
     * HTML 문자열을 안전하게 이스케이프
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 사용자 입력 검증 및 정화
     * @param {string} input - 검증할 입력값
     * @param {number} maxLength - 최대 길이
     * @returns {string} 정화된 입력값
     */
    sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';
        
        // 기본 정화
        let sanitized = input.trim();
        
        // 길이 제한
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        // 위험한 문자 제거 (기본적인 XSS 방지)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        return sanitized;
    },

    /**
     * 안전한 innerHTML 설정
     * @param {HTMLElement} element - 대상 엘리먼트
     * @param {string} content - 설정할 내용
     */
    safeSetHTML(element, content) {
        if (!element) return;
        element.textContent = content; // innerHTML 대신 textContent 사용
    },

    /**
     * URL 검증
     * @param {string} url - 검증할 URL
     * @returns {boolean} 유효한 URL인지 여부
     */
    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
};

// 날짜/시간 관련 함수들
export const DateUtils = {
    /**
     * 현재 시간대별 인사말 반환
     * @returns {string} 시간대별 인사말
     */
    getTimeGreeting() {
        const hour = new Date().getHours();
        const userName = localStorage.getItem('userName') || '';
        const namePrefix = userName ? `${userName}님, ` : '';
        
        if (hour >= 5 && hour < 12) {
            return `${namePrefix}좋은 아침입니다! ☀️`;
        } else if (hour >= 12 && hour < 17) {
            return `${namePrefix}즐거운 오후 되세요! ⛅`;
        } else if (hour >= 17 && hour < 22) {
            return `${namePrefix}편안한 저녁 시간이에요! 🌆`;
        } else {
            return `${namePrefix}고요한 밤 시간이네요! 🌙`;
        }
    },

    /**
     * 현재 계절 반환
     * @returns {string} 현재 계절
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    },

    /**
     * 형식화된 날짜 문자열 반환
     * @param {Date} date - 날짜 객체
     * @returns {string} 형식화된 날짜
     */
    formatDate(date = new Date()) {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    },

    /**
     * 상대적 시간 문자열 반환
     * @param {Date} date - 기준 날짜
     * @returns {string} 상대적 시간
     */
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString('ko-KR');
    }
};

// 로컬 스토리지 관리
export const Storage = {
    /**
     * 안전한 localStorage 읽기
     * @param {string} key - 키
     * @param {*} defaultValue - 기본값
     * @returns {*} 저장된 값 또는 기본값
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Storage get error for key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * 안전한 localStorage 쓰기
     * @param {string} key - 키
     * @param {*} value - 값
     * @returns {boolean} 성공 여부
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Storage set error for key "${key}":`, error);
            return false;
        }
    },

    /**
     * localStorage 아이템 삭제
     * @param {string} key - 키
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Storage remove error for key "${key}":`, error);
        }
    },

    /**
     * localStorage 전체 정리
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Storage clear error:', error);
        }
    }
};

// DOM 조작 헬퍼
export const DOM = {
    /**
     * 안전한 엘리먼트 선택
     * @param {string} selector - CSS 선택자
     * @param {Element} parent - 부모 엘리먼트
     * @returns {Element|null} 선택된 엘리먼트
     */
    $(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`DOM selection error for "${selector}":`, error);
            return null;
        }
    },

    /**
     * 안전한 다중 엘리먼트 선택
     * @param {string} selector - CSS 선택자
     * @param {Element} parent - 부모 엘리먼트
     * @returns {NodeList} 선택된 엘리먼트들
     */
    $$(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.warn(`DOM selection error for "${selector}":`, error);
            return [];
        }
    },

    /**
     * 엘리먼트 표시/숨김
     * @param {Element} element - 대상 엘리먼트
     * @param {boolean} show - 표시 여부
     */
    toggle(element, show) {
        if (!element) return;
        element.style.display = show ? '' : 'none';
    },

    /**
     * 클래스 토글
     * @param {Element} element - 대상 엘리먼트
     * @param {string} className - 클래스명
     * @param {boolean} force - 강제 설정
     */
    toggleClass(element, className, force) {
        if (!element) return;
        if (force !== undefined) {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
    }
};

// 애니메이션 헬퍼
export const Animation = {
    /**
     * 페이드 인 애니메이션
     * @param {Element} element - 대상 엘리먼트
     * @param {number} duration - 지속시간 (ms)
     * @returns {Promise} 애니메이션 완료 Promise
     */
    fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }

            element.style.opacity = '0';
            element.style.display = '';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    },

    /**
     * 페이드 아웃 애니메이션
     * @param {Element} element - 대상 엘리먼트
     * @param {number} duration - 지속시간 (ms)
     * @returns {Promise} 애니메이션 완료 Promise
     */
    fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }

            const start = performance.now();
            const startOpacity = parseFloat(getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = startOpacity * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
};

// 에러 처리
export const ErrorHandler = {
    /**
     * 에러 로깅 및 사용자 알림
     * @param {Error} error - 에러 객체
     * @param {string} context - 에러 컨텍스트
     * @param {boolean} showUser - 사용자에게 표시 여부
     */
    handle(error, context = 'Unknown', showUser = false) {
        console.error(`[${context}]`, error);
        
        // 개발 환경에서는 상세 에러 표시
        if (process?.env?.NODE_ENV === 'development') {
            console.trace();
        }
        
        if (showUser) {
            this.showUserError('죄송합니다. 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    },

    /**
     * 사용자에게 친화적인 에러 메시지 표시
     * @param {string} message - 에러 메시지
     */
    showUserError(message) {
        // 간단한 알림 (추후 더 나은 UI로 개선 가능)
        if (window.Notification && Notification.permission === 'granted') {
            new Notification('알림', { body: message, icon: '/icons/icon-192x192.png' });
        } else {
            alert(message);
        }
    }
};

// 성능 최적화 헬퍼
export const Performance = {
    /**
     * 디바운스 함수
     * @param {Function} func - 실행할 함수
     * @param {number} wait - 대기 시간 (ms)
     * @returns {Function} 디바운스된 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 스로틀 함수
     * @param {Function} func - 실행할 함수
     * @param {number} limit - 제한 시간 (ms)
     * @returns {Function} 스로틀된 함수
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};